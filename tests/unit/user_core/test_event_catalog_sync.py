import sys
from pathlib import Path

USER_CORE_ROOT = Path(__file__).resolve().parents[3] / "platform" / "user_core"
sys.path.insert(0, str(USER_CORE_ROOT))

from services import event_schema_registry  # type: ignore  # noqa: E402
from services.event_catalog import core_event_definitions  # type: ignore  # noqa: E402


def _normalize_schema(schema):
    if isinstance(schema, dict):
        return {
            key: _normalize_schema(value)
            for key, value in schema.items()
            if key != "description"
        }
    if isinstance(schema, list):
        return [_normalize_schema(item) for item in schema]
    return schema


def test_event_catalog_matches_registry():
    catalog_defs = core_event_definitions()
    registry_defs = event_schema_registry.CORE_EVENT_DEFINITIONS

    assert set(catalog_defs.keys()) == set(registry_defs.keys()), "事件型錄與程式定義不一致"

    for key in registry_defs:
        registry_entry = registry_defs[key]
        catalog_entry = catalog_defs[key]

        assert set(registry_entry["allowed_sources"]) == set(
            catalog_entry["allowed_sources"]
        ), f"事件 {key} 的來源專案不一致"
        assert _normalize_schema(registry_entry["schema"]) == _normalize_schema(
            catalog_entry["schema"]
        ), f"事件 {key} 的 schema 不一致"
