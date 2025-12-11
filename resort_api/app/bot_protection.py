"""
Bot protection utilities for resort_api.
Turnstile or reCAPTCHA depending on available secrets.
"""
from typing import Optional
import os
import httpx
from fastapi import HTTPException, status

TURNSTILE_SECRET = os.getenv("TURNSTILE_SECRET")
RECAPTCHA_SECRET = os.getenv("RECAPTCHA_SECRET")


async def verify_captcha(token: Optional[str]) -> None:
    """Verify captcha token if secrets are provided; skip if not configured."""
    secret: Optional[str]
    provider: Optional[str]
    if TURNSTILE_SECRET:
        secret = TURNSTILE_SECRET
        provider = "turnstile"
    elif RECAPTCHA_SECRET:
        secret = RECAPTCHA_SECRET
        provider = "recaptcha"
    else:
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

    if not payload.get("success"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Captcha verification failed"
        )
