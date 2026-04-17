#!/usr/bin/env python3
"""Validate whether a motion diff analysis is actionable."""

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

    files_checked = int(payload.get("files_checked", 0))
    selected_approach = str(payload.get("selected_approach", "unknown")).strip()
    library_usage = payload.get("library_usage", [])
    uses_reduced_motion = bool(payload.get("uses_reduced_motion", False))
    has_cleanup = bool(payload.get("has_cleanup", False))
    has_use_client_boundary = bool(payload.get("has_use_client_boundary", False))
    risky_property_total = int(payload.get("risky_property_total", 0))
    ssr_sensitive = bool(payload.get("ssr_sensitive", False))
    compositor_hits = int(payload.get("compositor_friendly_hits", 0))

    if not payload.get("valid", False):
        errors.append("Diff checker result is marked invalid.")
    if files_checked <= 0:
        errors.append("No files were checked.")

    if selected_approach != "css-waapi" and selected_approach != "unknown" and not library_usage:
        errors.append("Selected approach implies a library, but no library usage was detected.")

    if library_usage and not uses_reduced_motion:
        warnings.append("Animation usage was detected without reduced-motion handling.")

    if "gsap" in library_usage and not has_cleanup:
        warnings.append("GSAP usage appears to be missing cleanup logic.")

    if ssr_sensitive and library_usage and not has_use_client_boundary:
        warnings.append("SSR-sensitive usage may need an explicit client boundary.")

    if risky_property_total > 0:
        warnings.append("Potential layout-thrashing properties were detected in the motion diff.")

    if risky_property_total > 0 and compositor_hits == 0:
        errors.append("Risky motion properties were detected without any compositor-friendly motion signals.")

    result = {
        "valid": not errors,
        "errors": errors,
        "warnings": warnings,
        "summary": {
            "files_checked": files_checked,
            "selected_approach": selected_approach or "unknown",
        },
    }
    json.dump(result, sys.stdout, ensure_ascii=True, indent=2)
    sys.stdout.write("\n")
    return 0 if not errors else 1


if __name__ == "__main__":
    raise SystemExit(main())
