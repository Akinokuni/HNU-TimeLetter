#!/usr/bin/env python3
"""Inspect motion-related file changes for implementation quality signals."""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Any

RISKY_PATTERNS = {
    "top": re.compile(r"\btop\s*:", re.IGNORECASE),
    "left": re.compile(r"\bleft\s*:", re.IGNORECASE),
    "width": re.compile(r"(?<!-)\bwidth\s*:", re.IGNORECASE),
    "height": re.compile(r"(?<!-)\bheight\s*:", re.IGNORECASE),
    "margin": re.compile(r"\bmargin(?:Top|Left|Right|Bottom)?\s*:", re.IGNORECASE),
    "padding": re.compile(r"\bpadding(?:Top|Left|Right|Bottom)?\s*:", re.IGNORECASE),
}

COMPOSITOR_PATTERNS = (
    re.compile(r"\btransform\b", re.IGNORECASE),
    re.compile(r"\bopacity\b", re.IGNORECASE),
    re.compile(r"\bx\s*:", re.IGNORECASE),
    re.compile(r"\by\s*:", re.IGNORECASE),
    re.compile(r"\bscale(?:X|Y)?\b", re.IGNORECASE),
    re.compile(r"\brotate(?:X|Y|Z)?\b", re.IGNORECASE),
)


def load_json(path: str) -> dict[str, Any]:
    return json.loads(Path(path).read_text(encoding="utf-8-sig"))


def resolve_file(project_root: Path, raw_path: str) -> Path:
    path = Path(raw_path)
    return path if path.is_absolute() else (project_root / path)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True, dest="input_path")
    args = parser.parse_args()

    payload = load_json(args.input_path)
    project_root = Path(str(payload.get("project_root", "."))).resolve()
    changed_files = payload.get("changed_files", [])
    selected_approach = str(payload.get("selected_approach", "")).strip().lower()
    ssr_sensitive = bool(payload.get("ssr", False))

    library_usage: set[str] = set()
    risky_property_hits: list[dict[str, Any]] = []
    warnings: list[str] = []
    uses_reduced_motion = False
    has_cleanup = False
    has_use_client_boundary = False
    compositor_friendly_hits = 0
    files_checked = 0

    for raw_path in changed_files:
        file_path = resolve_file(project_root, str(raw_path))
        if not file_path.exists() or not file_path.is_file():
            warnings.append(f"Changed file does not exist: {file_path}")
            continue

        text = file_path.read_text(encoding="utf-8", errors="ignore")
        files_checked += 1
        extension = file_path.suffix.lower()
        is_script_like = extension in {".js", ".jsx", ".ts", ".tsx"}

        stripped = text.lstrip("\ufeff \t\r\n")
        if stripped.startswith("'use client'") or stripped.startswith('"use client"'):
            has_use_client_boundary = True

        lower_text = text.lower()
        if "framer-motion" in lower_text or "motion/react" in lower_text:
            library_usage.add("framer-motion")
        if "gsap" in lower_text or "scrolltrigger" in lower_text:
            library_usage.add("gsap")
        if "dotlottiereact" in lower_text or "lottie-react" in lower_text or "dotlottie" in lower_text:
            library_usage.add("lottie")
        if "from 'remotion'" in lower_text or 'from "remotion"' in lower_text or "@remotion/" in lower_text:
            library_usage.add("remotion")

        if "usereducedmotion" in lower_text or "prefers-reduced-motion" in lower_text or "reducedmotion" in lower_text:
            uses_reduced_motion = True

        if "@media" in lower_text and "prefers-reduced-motion" in lower_text:
            uses_reduced_motion = True

        cleanup_markers = ("return () =>", ".kill(", ".revert(", ".destroy(", "cancelanimationframe(")
        if any(marker in lower_text for marker in cleanup_markers):
            has_cleanup = True

        if is_script_like:
            for pattern in COMPOSITOR_PATTERNS:
                compositor_friendly_hits += len(pattern.findall(text))

            for property_name, pattern in RISKY_PATTERNS.items():
                count = len(pattern.findall(text))
                if count:
                    risky_property_hits.append(
                        {
                            "file": str(file_path),
                            "property": property_name,
                            "count": count,
                        }
                    )

    risky_property_total = sum(item["count"] for item in risky_property_hits)
    if selected_approach and selected_approach != "css-waapi" and not library_usage:
        warnings.append("Selected non-native approach but no matching library usage was detected in changed files.")
    if "gsap" in library_usage and not has_cleanup:
        warnings.append("GSAP usage was detected without a clear cleanup signal.")
    if risky_property_total > 0:
        warnings.append("Potential layout-thrashing animation properties were detected.")
    if ssr_sensitive and library_usage and not has_use_client_boundary:
        warnings.append("SSR-sensitive context with client animation usage but no explicit use client boundary was detected.")

    result = {
        "valid": files_checked > 0,
        "files_checked": files_checked,
        "library_usage": sorted(library_usage),
        "uses_reduced_motion": uses_reduced_motion,
        "has_cleanup": has_cleanup,
        "has_use_client_boundary": has_use_client_boundary,
        "selected_approach": selected_approach or "unknown",
        "ssr_sensitive": ssr_sensitive,
        "risky_property_total": risky_property_total,
        "risky_property_hits": risky_property_hits,
        "compositor_friendly_hits": compositor_friendly_hits,
        "warnings": warnings,
    }
    json.dump(result, sys.stdout, ensure_ascii=True, indent=2)
    sys.stdout.write("\n")
    return 0 if result["valid"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
