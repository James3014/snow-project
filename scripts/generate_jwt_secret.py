"""
Generate a strong JWT secret (HS256) for all services.

Usage:
  python scripts/generate_jwt_secret.py

It prints a 64-byte urlsafe base64 secret. Store it in your secret manager and
propagate to env vars:
  JWT_SECRET_KEY=<printed_value>
  JWT_ALGORITHM=HS256
  JWT_AUDIENCE=user_core
  JWT_ISSUER=SnowTrace
"""
import secrets


def main() -> None:
    secret = secrets.token_urlsafe(64)
    print(secret)


if __name__ == "__main__":
    main()
