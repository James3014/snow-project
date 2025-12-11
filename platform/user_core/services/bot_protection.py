"""
Bot protection helpers: Turnstile / reCAPTCHA verification.

If secrets are not configured, verification is skipped to keep backward compatibility.
"""
from typing import Optional, Literal
import os

import httpx
from fastapi import HTTPException, status


TURNSTILE_SECRET = os.getenv("TURNSTILE_SECRET")
RECAPTCHA_SECRET = os.getenv("RECAPTCHA_SECRET")


async def verify_captcha(
    token: Optional[str],
    client_ip: Optional[str] = None,
) -> None:
    """
    Verify the captcha token if any secret is configured.

    - Prefers Turnstile if TURNSTILE_SECRET is set, otherwise uses RECAPTCHA_SECRET.
    - Raises HTTPException on failure.
    - If no secret is configured, the check is skipped (for environments not yet wired).
    """
    secret: Optional[str]
    provider: Optional[Literal["turnstile", "recaptcha"]]

    if TURNSTILE_SECRET:
        secret = TURNSTILE_SECRET
        provider = "turnstile"
    elif RECAPTCHA_SECRET:
        secret = RECAPTCHA_SECRET
        provider = "recaptcha"
    else:
        # Not configured -> allow
        return

    if not token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Captcha token missing",
        )

    if provider == "turnstile":
        url = "https://challenges.cloudflare.com/turnstile/v0/siteverify"
        data = {"secret": secret, "response": token}
    else:
        url = "https://www.google.com/recaptcha/api/siteverify"
        data = {"secret": secret, "response": token}
        if client_ip:
            data["remoteip"] = client_ip

    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.post(url, data=data)
            resp.raise_for_status()
            payload = resp.json()
    except httpx.HTTPError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Captcha verification unavailable"
        )

    success = bool(payload.get("success"))
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Captcha verification failed"
        )
