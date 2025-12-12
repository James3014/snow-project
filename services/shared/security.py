"""
安全性強化
"""
import time
import hashlib
from typing import Dict, Optional
from collections import defaultdict, deque


class RateLimiter:
    """API 速率限制"""
    
    def __init__(self, max_requests: int = 100, window_seconds: int = 60):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.requests: Dict[str, deque] = defaultdict(deque)
    
    def is_allowed(self, identifier: str) -> bool:
        """檢查是否允許請求"""
        now = time.time()
        window_start = now - self.window_seconds
        
        # 清理過期請求
        user_requests = self.requests[identifier]
        while user_requests and user_requests[0] < window_start:
            user_requests.popleft()
        
        # 檢查限制
        if len(user_requests) >= self.max_requests:
            return False
        
        # 記錄請求
        user_requests.append(now)
        return True


class SecurityHeaders:
    """安全標頭配置"""
    
    @staticmethod
    def get_headers() -> Dict[str, str]:
        """獲取安全標頭"""
        return {
            "X-Content-Type-Options": "nosniff",
            "X-Frame-Options": "DENY",
            "X-XSS-Protection": "1; mode=block",
            "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
            "Content-Security-Policy": "default-src 'self'",
            "Referrer-Policy": "strict-origin-when-cross-origin"
        }


class InputValidator:
    """輸入驗證強化"""
    
    @staticmethod
    def sanitize_string(value: str, max_length: int = 1000) -> str:
        """清理字符串輸入"""
        if not isinstance(value, str):
            raise ValueError("Input must be string")
        
        # 長度限制
        if len(value) > max_length:
            raise ValueError(f"Input too long (max {max_length})")
        
        # 移除危險字符
        dangerous_chars = ['<', '>', '"', "'", '&', '\x00']
        for char in dangerous_chars:
            value = value.replace(char, '')
        
        return value.strip()
    
    @staticmethod
    def validate_email(email: str) -> bool:
        """驗證郵箱格式"""
        import re
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return bool(re.match(pattern, email))


class SecretManager:
    """密鑰管理"""
    
    def __init__(self):
        self._secrets: Dict[str, str] = {}
    
    def set_secret(self, key: str, value: str):
        """設置密鑰"""
        # 簡化實現，實際應使用加密存儲
        hashed_key = hashlib.sha256(key.encode()).hexdigest()
        self._secrets[hashed_key] = value
    
    def get_secret(self, key: str) -> Optional[str]:
        """獲取密鑰"""
        hashed_key = hashlib.sha256(key.encode()).hexdigest()
        return self._secrets.get(hashed_key)


# 全局實例
_rate_limiter = RateLimiter()
_secret_manager = SecretManager()


def get_rate_limiter() -> RateLimiter:
    return _rate_limiter


def get_secret_manager() -> SecretManager:
    return _secret_manager


def security_middleware():
    """安全中間件"""
    def decorator(func):
        def wrapper(*args, **kwargs):
            # 添加安全標頭
            headers = SecurityHeaders.get_headers()
            
            # 速率限制檢查
            client_ip = "127.0.0.1"  # 實際應從請求中獲取
            if not get_rate_limiter().is_allowed(client_ip):
                raise Exception("Rate limit exceeded")
            
            return func(*args, **kwargs)
        return wrapper
    return decorator
