#!/usr/bin/env python3
"""Score motion-library choices for a React animation request."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any


def load_json(path: str) -> dict[str, Any]:
    return json.loads(Path(path).read_text(encoding="utf-8-sig"))


def add_score(bucket: dict[str, Any], points: int, reason: str) -> None:
    bucket["score"] += points
    bucket["reasons"].append(reason)


def has_any(text: str, keywords: tuple[str, ...]) -> bool:
    return any(keyword in text for keyword in keywords)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True, dest="input_path")
    args = parser.parse_args()

    payload = load_json(args.input_path)
    motion_goal = str(payload.get("motion_goal", "")).strip()
    trigger_type = str(payload.get("trigger_type", "")).strip().lower()
    scope = str(payload.get("scope", "")).strip().lower()
    constraints = dict(payload.get("constraints", {}))
    project_context = dict(payload.get("project_context", {}))
    existing_libs = [str(item).strip().lower() for item in project_context.get("existing_motion_libs", [])]

    valid = bool(motion_goal)
    if not valid:
        json.dump(
            {
                "valid": False,
                "selected_approach": "unknown",
                "dependency_impact": "unknown",
                "candidate_scores": [],
                "rejected_options": [],
                "considered_dimensions": [],
                "warnings": ["motion_goal is required."],
            },
            sys.stdout,
            ensure_ascii=True,
            indent=2,
        )
        sys.stdout.write("\n")
        return 1

    text = " ".join(
        [
            motion_goal.lower(),
            trigger_type,
            scope,
            json.dumps(constraints, ensure_ascii=True).lower(),
        ]
    )

    candidates: dict[str, dict[str, Any]] = {
        "css-waapi": {"score": 0, "reasons": []},
        "framer-motion": {"score": 0, "reasons": []},
        "gsap": {"score": 0, "reasons": []},
        "lottie": {"score": 0, "reasons": []},
        "remotion": {"score": 0, "reasons": []},
    }

    simple_keywords = ("simple", "hover", "tap", "button", "fade", "slide", "entrance", "list", "stagger")
    layout_keywords = ("layout", "shared layout", "route", "page transition", "modal", "presence")
    scroll_keywords = ("scroll", "parallax", "pin", "scrub", "sticky", "scrolltrigger")
    timeline_keywords = ("timeline", "sequence", "orchestr", "sync", "choreograph")
    resource_keywords = ("lottie", "dotlottie", "bodymovin", "json animation", "illustration")
    video_keywords = ("video", "composition", "frame", "subtitles", "caption", "render")

    if has_any(text, simple_keywords):
        add_score(candidates["css-waapi"], 3, "Simple UI motion can often be handled without a heavy library.")
        add_score(candidates["framer-motion"], 2, "Simple UI interactions map well to declarative motion components.")

    if has_any(text, layout_keywords):
        add_score(candidates["framer-motion"], 4, "Shared layout and route transitions strongly favor Framer Motion.")

    if has_any(text, scroll_keywords):
        add_score(candidates["gsap"], 5, "Complex scroll-driven motion strongly favors GSAP with ScrollTrigger.")
        add_score(candidates["framer-motion"], 1, "Framer Motion can cover lighter in-view animations.")

    if has_any(text, timeline_keywords):
        add_score(candidates["gsap"], 4, "Sequenced or choreographed motion benefits from timeline control.")

    if has_any(text, resource_keywords):
        add_score(candidates["lottie"], 5, "Resource-based animation assets point to Lottie.")

    if has_any(text, video_keywords) or scope == "video":
        add_score(candidates["remotion"], 5, "Frame-driven or rendered video content points to Remotion.")

    if scope == "component":
        add_score(candidates["css-waapi"], 2, "Component-scoped motion is often lightweight.")
        add_score(candidates["framer-motion"], 2, "Component-scoped motion is a common Framer Motion fit.")
    elif scope in {"page", "route"}:
        add_score(candidates["framer-motion"], 2, "Page and route motion often fit declarative transition patterns.")

    allow_new_dependencies = constraints.get("allow_new_dependencies", True)
    if allow_new_dependencies is False:
        add_score(candidates["css-waapi"], 5, "No-new-dependency constraint strongly favors native motion.")
        candidates["framer-motion"]["score"] -= 2
        candidates["gsap"]["score"] -= 3
        candidates["lottie"]["score"] -= 3
        candidates["remotion"]["score"] -= 4

    needs_ssr = bool(constraints.get("needs_ssr", False) or project_context.get("ssr", False))
    if needs_ssr:
        add_score(candidates["css-waapi"], 2, "SSR-sensitive projects benefit from lighter client boundaries.")
        add_score(candidates["framer-motion"], 1, "Framer Motion can work with clear client boundaries.")
        candidates["gsap"]["score"] -= 1
        candidates["lottie"]["score"] -= 1

    performance_budget = str(constraints.get("performance_budget", "")).strip().lower()
    if performance_budget in {"tight", "strict", "low"}:
        add_score(candidates["css-waapi"], 3, "Tight performance budget favors the lightest possible approach.")
        add_score(candidates["framer-motion"], 1, "Framer Motion can still fit if the scope stays narrow.")
        candidates["gsap"]["score"] -= 1
        candidates["lottie"]["score"] -= 2

    mobile_priority = bool(constraints.get("mobile_priority", False))
    if mobile_priority:
        add_score(candidates["css-waapi"], 1, "Mobile-priority experiences benefit from lightweight rendering paths.")
        add_score(candidates["framer-motion"], 1, "Framer Motion can fit mobile if scope remains controlled.")
        candidates["lottie"]["score"] -= 1

    if "framer-motion" in existing_libs or "motion" in existing_libs:
        add_score(candidates["framer-motion"], 3, "The project already includes a Framer Motion-compatible dependency.")
    if "gsap" in existing_libs:
        add_score(candidates["gsap"], 3, "The project already includes GSAP.")
    if "lottie" in existing_libs:
        add_score(candidates["lottie"], 3, "The project already includes a Lottie dependency.")
    if "remotion" in existing_libs:
        add_score(candidates["remotion"], 3, "The project already includes Remotion.")

    sorted_candidates = sorted(
        (
            {
                "name": name,
                "score": data["score"],
                "reasons": data["reasons"] or ["No strong positive signal was detected."],
            }
            for name, data in candidates.items()
        ),
        key=lambda item: item["score"],
        reverse=True,
    )

    selected = sorted_candidates[0]
    dependency_impact = "reuse existing capability"
    if selected["name"] == "css-waapi":
        dependency_impact = "no new dependency required"
    elif selected["name"] == "framer-motion" and not any(lib in existing_libs for lib in {"framer-motion", "motion"}):
        dependency_impact = "add dependency: framer-motion or motion"
    elif selected["name"] == "gsap" and "gsap" not in existing_libs:
        dependency_impact = "add dependency: gsap"
    elif selected["name"] == "lottie" and "lottie" not in existing_libs:
        dependency_impact = "add dependency: lottie-react or @lottiefiles/dotlottie-react"
    elif selected["name"] == "remotion" and "remotion" not in existing_libs:
        dependency_impact = "add dependency: remotion"

    rejected_options = [
        {
            "name": candidate["name"],
            "reason": candidate["reasons"][0],
        }
        for candidate in sorted_candidates[1:]
    ]

    warnings: list[str] = []
    if selected["score"] < 3:
        warnings.append("No candidate achieved a strong fit score; keep the implementation scope small.")
    if selected["name"] != "css-waapi" and allow_new_dependencies is False:
        warnings.append("Selected approach conflicts with the no-new-dependency constraint.")
    if selected["name"] == "lottie" and performance_budget in {"tight", "strict", "low"}:
        warnings.append("Lottie was selected under a tight performance budget; asset size must be controlled carefully.")

    result = {
        "valid": True,
        "selected_approach": selected["name"],
        "dependency_impact": dependency_impact,
        "candidate_scores": sorted_candidates,
        "rejected_options": rejected_options,
        "considered_dimensions": [
            "scope",
            "trigger",
            "performance",
            "ssr",
            "dependency_cost",
            "maintenance",
        ],
        "warnings": warnings,
    }
    json.dump(result, sys.stdout, ensure_ascii=True, indent=2)
    sys.stdout.write("\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
