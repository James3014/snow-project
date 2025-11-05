from __future__ import annotations

from pathlib import Path
from typing import Dict, Tuple, Any

import yaml

# 預設指向 specs/shared 目錄中的事件型錄檔案
DEFAULT_CATALOG_PATH = (
    Path(__file__).resolve().parents[3] / "specs" / "shared" / "event_catalog.yaml"
)


def load_catalog(path: Path = DEFAULT_CATALOG_PATH) -> Dict[str, Any]:
    """載入事件型錄 YAML 檔案。"""
    with path.open("r", encoding="utf-8") as stream:
        data = yaml.safe_load(stream)
    return data or {}


def core_event_definitions(path: Path = DEFAULT_CATALOG_PATH) -> Dict[Tuple[str, int], Dict[str, Any]]:
    """
    依 event_type × version 建立核心事件對照表。

    回傳格式：
    {
        ("event.type", 1): {
            "allowed_sources": {"project-name"},
            "schema": {...payload schema...},
        },
        ...
    }
    """
    catalog = load_catalog(path)
    events = catalog.get("core_events", [])
    definitions: Dict[Tuple[str, int], Dict[str, Any]] = {}

    for entry in events:
        if entry.get("status") != "active":
            continue

        event_type = entry["event_type"]
        version = int(entry["version"])
        allowed_sources = {entry["source_project"]}
        schema = entry.get("payload_schema", {})

        definitions[(event_type, version)] = {
            "allowed_sources": allowed_sources,
            "schema": schema,
        }

    return definitions
