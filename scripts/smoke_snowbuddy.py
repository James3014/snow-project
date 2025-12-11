"""
Smoke test for snowbuddy_matching.

Usage:
  SNOWBUDDY_BASE_URL=https://snowbuddy.example.com TOKEN=<jwt> X_API_KEY=<key> python scripts/smoke_snowbuddy.py

Checks:
- /health
- POST /matching/searches (requires auth, API key if enforced, CAPTCHA skipped for smoke)
- GET /matching/searches/{id}
"""
import os
import sys
import requests
import uuid


BASE_URL = os.getenv("SNOWBUDDY_BASE_URL")
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
    # CAPTCHA is skipped for smoke; ensure server is configured to allow or provide a test token if required
    return headers


def check_health():
    resp = requests.get(f"{BASE_URL}/health", timeout=5)
    resp.raise_for_status()
    print("health: ok")


def start_search() -> str:
    payload = {
        "skill_level": "intermediate",
        "preferred_languages": ["en"],
        "preferred_regions": ["hokkaido"],
        "travel_dates": {"start": "2025-01-01", "end": "2025-01-05"},
    }
    resp = requests.post(f"{BASE_URL}/matching/searches", json=payload, headers=auth_headers(), timeout=10)
    resp.raise_for_status()
    data = resp.json()
    search_id = data.get("search_id")
    if not search_id:
        raise RuntimeError("search_id missing")
    print("start_search: ok")
    return search_id


def get_search(search_id: str):
    resp = requests.get(f"{BASE_URL}/matching/searches/{search_id}", headers=auth_headers(), timeout=10)
    resp.raise_for_status()
    print("get_search: ok")


def main():
    if not BASE_URL:
        skip("SNOWBUDDY_BASE_URL not set")
        return
    if not TOKEN:
        skip("TOKEN not set; matching requires auth")
        return
    check_health()
    search_id = start_search()
    get_search(search_id)


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(f"FAIL: {exc}", file=sys.stderr)
        sys.exit(1)
