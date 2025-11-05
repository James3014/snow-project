import sys
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parents[3]
USER_CORE_ROOT = ROOT / "platform" / "user_core"
sys.path.insert(0, str(USER_CORE_ROOT))

from api.main import app  # type: ignore  # noqa: E402


def test_openapi_contract_matches_export():
    contract_path = ROOT / "specs" / "user-core" / "contracts" / "api-openapi.yaml"
    with contract_path.open("r", encoding="utf-8") as fh:
        contract = yaml.safe_load(fh)

    generated = app.openapi()

    assert generated == contract
