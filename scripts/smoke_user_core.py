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
CAPTCHA_TOKEN = os.getenv("CAPTCHA_TOKEN")


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


def _auth_headers(include_captcha: bool = False) -> dict:
    headers = {}
    if TOKEN:
        headers["Authorization"] = f"Bearer {TOKEN}"
    if include_captcha and CAPTCHA_TOKEN:
        headers["X-Captcha-Token"] = CAPTCHA_TOKEN
    return headers


def check_calendar_trip():
    if not TOKEN:
        skip("TOKEN missing; skip calendar tests")
        return
    payload = {
        "title": "Smoke trip",
        "start_date": "2025-01-01T00:00:00+00:00",
        "end_date": "2025-01-02T00:00:00+00:00",
    }
    headers = _auth_headers(include_captcha=True)
    resp = requests.post(f"{BASE_URL}/calendar/trips", json=payload, headers=headers, timeout=5)
    resp.raise_for_status()
    resp = requests.get(f"{BASE_URL}/calendar/trips", headers=_auth_headers(), timeout=5)
    resp.raise_for_status()
    print("calendar trips: ok")


def check_calendar_event():
    if not TOKEN:
        return
    payload = {
        "type": "TRIP",
        "title": "Smoke event",
        "start_date": "2025-01-01T00:00:00+00:00",
        "end_date": "2025-01-01T12:00:00+00:00",
    }
    headers = _auth_headers(include_captcha=True)
    resp = requests.post(f"{BASE_URL}/calendar/events", json=payload, headers=headers, timeout=5)
    resp.raise_for_status()
    print("calendar events: ok")


def main() -> None:
    if not BASE_URL:
        skip("USER_CORE_BASE_URL not set")
        return
    check_health()
    if TOKEN:
        check_validate()
        check_calendar_trip()
        check_calendar_event()
    else:
        skip("TOKEN not set; skipping auth/calendar tests")


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(f"FAIL: {exc}", file=sys.stderr)
        sys.exit(1)
