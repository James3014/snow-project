"""
Lightweight smoke test for user_core.

Usage:
  USER_CORE_BASE_URL=https://user-core.example.com TOKEN=<jwt> python scripts/smoke_user_core.py

If envs are missing, tests are skipped gracefully.
"""
import os
import sys
import requests


BASE_URL = os.getenv("USER_CORE_BASE_URL")
TOKEN = os.getenv("TOKEN")


def skip(msg: str) -> None:
    print(f"SKIP: {msg}")


def check_health() -> None:
    resp = requests.get(f"{BASE_URL}/health", timeout=5)
    resp.raise_for_status()
    data = resp.json()
    assert data.get("status") == "ok", f"Unexpected health payload: {data}"
    print("health: ok")


def check_validate() -> None:
    headers = {"Authorization": f"Bearer {TOKEN}"}
    resp = requests.get(f"{BASE_URL}/auth/validate", headers=headers, timeout=5)
    resp.raise_for_status()
    data = resp.json()
    assert "user_id" in data, "validate response missing user_id"
    print("validate: ok")


def main() -> None:
    if not BASE_URL:
        skip("USER_CORE_BASE_URL not set")
        return
    check_health()
    if TOKEN:
        check_validate()
    else:
        skip("TOKEN not set; skipping /auth/validate")


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(f"FAIL: {exc}", file=sys.stderr)
        sys.exit(1)
