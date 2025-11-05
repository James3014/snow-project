import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
CONTRACT = ROOT / "specs" / "user-core" / "contracts" / "change-feed.md"


def test_change_feed_json_examples_are_valid():
    content = CONTRACT.read_text(encoding="utf-8")
    blocks = re.findall(r"```json\n(.*?)\n```", content, flags=re.DOTALL)
    assert blocks, "文件中找不到 json 範例"
    for block in blocks:
        json.loads(block)
