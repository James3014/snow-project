"""Customizes import path so our local `platform` directory can host packages."""
from __future__ import annotations

import sys
from pathlib import Path


def _extend_platform_package() -> None:
    root = Path(__file__).resolve().parent
    pkg_dir = root / "platform"
    if not pkg_dir.is_dir():
        return

    platform_module = sys.modules.get("platform")
    if platform_module is None:
        return

    pkg_path = str(pkg_dir)
    existing = getattr(platform_module, "__path__", [])
    if pkg_path in existing:
        return

    try:
        new_path = list(existing)
        new_path.append(pkg_path)
        platform_module.__path__ = new_path  # type: ignore[attr-defined]
        spec = getattr(platform_module, "__spec__", None)
        if spec and getattr(spec, "submodule_search_locations", None) is not None:
            spec.submodule_search_locations.append(pkg_path)  # type: ignore[union-attr]
    except Exception:
        pass


_extend_platform_package()
