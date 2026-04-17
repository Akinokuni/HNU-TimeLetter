#!/usr/bin/env python3
"""Validate whether a motion-library selection result is actionable."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any


def load_json(path: str) -> dict[str, Any]:
    return json.loads(Path(path).read_text(encoding="utf-8-sig"))


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True, dest="input_path")
    args = parser.parse_args()

    payload = load_json(args.input_path)
    errors: list[str] = []
    warnings: list[str] = []

    selected = str(payload.get("selected_approach", "")).strip()
    candidates = payload.get("candidate_scores", [])
    dimensions = payload.get("considered_dimensions", [])
    rejected = payload.get("rejected_options", [])

    if not payload.get("valid", False):
        errors.append("Selection result is marked invalid.")
    if not selected:
        errors.append("selected_approach is empty.")
    if not isinstance(candidates, list) or not candidates:
        errors.append("candidate_scores must be a non-empty list.")
        candidates = []

    if selected and candidates and selected not in {item.get("name") for item in candidates if isinstance(item, dict)}:
        errors.append("selected_approach does not appear in candidate_scores.")

    required_dimensions = {"performance", "ssr", "dependency_cost"}
    if not isinstance(dimensions, list) or not required_dimensions.issubset(set(dimensions)):
        errors.append("considered_dimensions must include performance, ssr, and dependency_cost.")

    if isinstance(rejected, list) and len(rejected) < 2:
        warnings.append("Rejected options list is short; alternatives may be underexplained.")

    top_score = None
    if candidates:
        top_score = candidates[0].get("score")
        if isinstance(top_score, int) and top_score < 3:
            warnings.append("Top candidate score is weak; selected approach may need manual review.")

    dependency_impact = str(payload.get("dependency_impact", "")).strip()
    if selected != "css-waapi" and not dependency_impact:
        errors.append("dependency_impact must explain how the selected library affects dependencies.")

    result = {
        "valid": not errors,
        "errors": errors,
        "warnings": warnings,
        "summary": {
            "selected_approach": selected or "unknown",
            "candidate_count": len(candidates),
        },
    }
    json.dump(result, sys.stdout, ensure_ascii=True, indent=2)
    sys.stdout.write("\n")
    return 0 if not errors else 1


if __name__ == "__main__":
    raise SystemExit(main())
