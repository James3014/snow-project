"""
Smoke test for resort_api.

Usage:
  RESORT_API_BASE_URL=https://resort.example.com TOKEN=<jwt> X_API_KEY=<key> python scripts/smoke_resort_api.py

Checks:
- /health
- /resorts (with small page)
- /resorts/{id} (uses first id from list)
- /resorts/{id}/share-card (requires API key; skips if missing)
"""
import os
import sys
import requests


BASE_URL = os.getenv("RESORT_API_BASE_URL")
TOKEN = os.getenv("TOKEN")
X_API_KEY = os.getenv("X_API_KEY")


def skip(msg: str) -> None:
    print(f"SKIP: {msg}")


def auth_headers() -> dict:
    headers = {}
    if TOKEN:
        headers["Authorization"] = f"Bearer {TOKEN}"
    if X_API_KEY:
        headers["X-API-Key"] = X_API_KEY
    return headers


def check_health():
    resp = requests.get(f"{BASE_URL}/health", timeout=5)
    resp.raise_for_status()
    print("health: ok")


def list_resorts():
    resp = requests.get(f"{BASE_URL}/resorts", params={"limit": 1}, headers=auth_headers(), timeout=10)
    resp.raise_for_status()
    data = resp.json()
    print("resorts list: ok")
    items = data.get("items") or []
    if not items:
        skip("no resorts returned; skipping detail/share-card")
        return None
    return items[0].get("resort_id")


def resort_detail(resort_id: str):
    resp = requests.get(f"{BASE_URL}/resorts/{resort_id}", headers=auth_headers(), timeout=10)
    resp.raise_for_status()
    print("resort detail: ok")


def share_card(resort_id: str):
    if not X_API_KEY:
        skip("X_API_KEY missing; skip share-card")
        return
    resp = requests.get(
        f"{BASE_URL}/resorts/{resort_id}/share-card",
        headers=auth_headers(),
        timeout=20,
    )
    resp.raise_for_status()
    print("share-card: ok (image bytes returned)")


def main():
    if not BASE_URL:
        skip("RESORT_API_BASE_URL not set")
        return
    check_health()
    resort_id = list_resorts()
    if resort_id:
        resort_detail(resort_id)
        share_card(resort_id)


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(f"FAIL: {exc}", file=sys.stderr)
        sys.exit(1)
