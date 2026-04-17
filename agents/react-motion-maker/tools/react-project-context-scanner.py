#!/usr/bin/env python3
"""Scan a React project and summarize its implementation context."""

from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path
from typing import Any

SKIP_DIRS = {
    ".git",
    ".next",
    "node_modules",
    "dist",
    "build",
    "coverage",
    "out",
    ".turbo",
}

MOTION_DEP_MAP = {
    "framer-motion": "framer-motion",
    "motion": "motion",
    "gsap": "gsap",
    "@gsap/react": "gsap",
    "lottie-react": "lottie",
    "@lottiefiles/dotlottie-react": "lottie",
    "@lottiefiles/dotlottie-web": "lottie",
    "remotion": "remotion",
    "@remotion/player": "remotion",
}


def load_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8-sig"))


def find_first(root: Path, names: list[str]) -> Path | None:
    for name in names:
        candidate = root / name
        if candidate.exists():
            return candidate
    return None


def collect_files(root: Path, suffixes: tuple[str, ...], limit: int = 20) -> list[Path]:
    matches: list[Path] = []
    for current_root, dirs, files in os.walk(root):
        dirs[:] = [item for item in dirs if item not in SKIP_DIRS]
        for filename in files:
            if filename.endswith(suffixes):
                matches.append(Path(current_root) / filename)
                if len(matches) >= limit:
                    return matches
    return matches


def normalize_version(raw: str) -> str:
    return raw.strip() if raw else "unknown"


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--project-root", required=True, dest="project_root")
    args = parser.parse_args()

    root = Path(args.project_root).resolve()
    warnings: list[str] = []

    if not root.exists() or not root.is_dir():
        json.dump(
            {
                "valid": False,
                "framework": "unknown",
                "react_version": "unknown",
                "typescript": False,
                "styling": [],
                "existing_motion_libs": [],
                "ssr": False,
                "package_manager": "unknown",
                "package_json_path": "",
                "notable_files": [],
                "warnings": [f"Project root does not exist: {root}"],
            },
            sys.stdout,
            ensure_ascii=True,
            indent=2,
        )
        sys.stdout.write("\n")
        return 1

    package_json = root / "package.json"
    deps: dict[str, str] = {}
    dev_deps: dict[str, str] = {}
    if package_json.exists():
        package_data = load_json(package_json)
        deps = dict(package_data.get("dependencies", {}))
        dev_deps = dict(package_data.get("devDependencies", {}))
    else:
        warnings.append("package.json was not found at the provided project root.")

    combined_deps = {**dev_deps, **deps}

    next_config = find_first(root, ["next.config.js", "next.config.mjs", "next.config.ts"])
    vite_config = find_first(root, ["vite.config.ts", "vite.config.js", "vite.config.mjs"])
    remix_config = find_first(root, ["remix.config.js", "remix.config.mjs", "remix.config.ts"])
    tsconfig = root / "tsconfig.json"
    tailwind_config = find_first(
        root,
        [
            "tailwind.config.js",
            "tailwind.config.cjs",
            "tailwind.config.ts",
            "tailwind.config.mjs",
        ],
    )

    framework = "unknown"
    if "next" in combined_deps or next_config:
        framework = "nextjs"
    elif "vite" in combined_deps or vite_config:
        framework = "vite"
    elif "react-scripts" in combined_deps:
        framework = "cra"
    elif "@remix-run/react" in combined_deps or remix_config:
        framework = "remix"
    elif "react" in combined_deps:
        framework = "react"

    react_version = normalize_version(combined_deps.get("react", "unknown"))
    typescript = tsconfig.exists() or "typescript" in combined_deps
    ssr = framework in {"nextjs", "remix"}

    styling: list[str] = []
    if tailwind_config or "tailwindcss" in combined_deps:
        styling.append("tailwind")
    if "styled-components" in combined_deps:
        styling.append("styled-components")
    if "@emotion/react" in combined_deps:
        styling.append("emotion")
    if "sass" in combined_deps or "node-sass" in combined_deps:
        styling.append("sass")
    css_module_files = collect_files(root, (".module.css", ".module.scss"), limit=3)
    if css_module_files:
        styling.append("css-modules")
    if not styling:
        styling.append("plain-css")

    existing_motion_libs: list[str] = []
    for dep_name, normalized in MOTION_DEP_MAP.items():
        if dep_name in combined_deps and normalized not in existing_motion_libs:
            existing_motion_libs.append(normalized)

    lockfiles = {
        "pnpm-lock.yaml": "pnpm",
        "yarn.lock": "yarn",
        "package-lock.json": "npm",
        "bun.lockb": "bun",
        "bun.lock": "bun",
    }
    package_manager = "unknown"
    for filename, label in lockfiles.items():
        if (root / filename).exists():
            package_manager = label
            break

    notable_paths: list[Path] = [
        path
        for path in [package_json, next_config, vite_config, remix_config, tsconfig, tailwind_config]
        if path and path.exists()
    ]
    notable_paths.extend(css_module_files)
    for special in [root / "app", root / "src", root / "pages"]:
        if special.exists():
            notable_paths.append(special)

    if react_version == "unknown":
        warnings.append("React dependency was not found in dependencies or devDependencies.")
    if package_manager == "unknown":
        warnings.append("Package manager lockfile was not detected.")
    if not existing_motion_libs:
        warnings.append("No existing motion library dependency was detected.")
    if framework == "unknown":
        warnings.append("Framework could not be identified from config files or dependencies.")

    result = {
        "valid": package_json.exists() and react_version != "unknown",
        "framework": framework,
        "react_version": react_version,
        "typescript": typescript,
        "styling": styling,
        "existing_motion_libs": existing_motion_libs,
        "ssr": ssr,
        "package_manager": package_manager,
        "package_json_path": str(package_json.resolve()) if package_json.exists() else "",
        "notable_files": [str(path.resolve()) for path in notable_paths],
        "warnings": warnings,
    }
    json.dump(result, sys.stdout, ensure_ascii=True, indent=2)
    sys.stdout.write("\n")
    return 0 if result["valid"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
