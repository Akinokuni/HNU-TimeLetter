#!/usr/bin/env python3
"""Validate whether a React project context scan is actionable."""

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

    required_fields = [
        "valid",
        "framework",
        "react_version",
        "typescript",
        "styling",
        "existing_motion_libs",
        "ssr",
        "package_manager",
        "package_json_path",
        "notable_files",
        "warnings",
    ]
    for field in required_fields:
        if field not in payload:
            errors.append(f"Missing required field: {field}")

    if payload.get("framework") == "unknown":
        warnings.append("Framework is unknown, which weakens library selection confidence.")

    react_version = str(payload.get("react_version", "unknown")).strip()
    if react_version == "unknown":
        errors.append("React version was not resolved.")

    package_json_path = str(payload.get("package_json_path", "")).strip()
    if not package_json_path:
        errors.append("package_json_path is empty.")

    if payload.get("framework") == "nextjs" and payload.get("ssr") is not True:
        errors.append("Next.js projects should be marked as ssr=true.")

    styling = payload.get("styling", [])
    if not isinstance(styling, list) or not styling:
        warnings.append("No styling strategy was detected.")

    motion_libs = payload.get("existing_motion_libs", [])
    if not isinstance(motion_libs, list):
        errors.append("existing_motion_libs must be a list.")
        motion_libs = []
    elif not motion_libs:
        warnings.append("No existing motion library was detected; adding a dependency may be required.")

    result = {
        "valid": not errors,
        "errors": errors,
        "warnings": warnings,
        "summary": {
            "framework": str(payload.get("framework", "unknown")),
            "ssr": bool(payload.get("ssr", False)),
            "motion_lib_count": len(motion_libs),
        },
    }
    json.dump(result, sys.stdout, ensure_ascii=True, indent=2)
    sys.stdout.write("\n")
    return 0 if not errors else 1


if __name__ == "__main__":
    raise SystemExit(main())
