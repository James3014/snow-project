"""
Authentication dependencies

簡單的 JWT 验证，与 user_core 保持一致
"""
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from uuid import UUID
from config import settings

security = HTTPBearer()


def get_current_user_id(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> UUID:
    """
    从 JWT token 中提取 user_id

    簡單实用：只验证 token 有效性，不做复杂的权限檢查
    """
    token = credentials.credentials

    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=["HS256"])
        user_id_str = payload.get("sub")
        if user_id_str is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials"
            )
        return UUID(user_id_str)
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials"
        )
