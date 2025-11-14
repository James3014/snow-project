"""
Notification System Integration

简单实用：调用通知 API，失败重试
"""
import httpx
import logging
from typing import Optional
from uuid import UUID
import time

import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from config import settings

logger = logging.getLogger(__name__)


def send_notification(
    user_id: UUID,
    message: str,
    notification_type: str = "gear_reminder",
    max_retries: int = 3
) -> bool:
    """
    发送通知

    实用主义：
    - 如果通知系统不可用，记录日志但不崩溃
    - 简单的指数退避重试
    """
    url = f"{settings.notification_gateway_url}/notifications"

    payload = {
        "user_id": str(user_id),
        "message": message,
        "type": notification_type
    }

    for attempt in range(max_retries):
        try:
            response = httpx.post(
                url,
                json=payload,
                timeout=5.0
            )
            response.raise_for_status()
            logger.info(f"Notification sent to user {user_id}")
            return True

        except httpx.HTTPError as e:
            logger.warning(f"Notification attempt {attempt + 1} failed: {e}")
            if attempt < max_retries - 1:
                # 指数退避：2^n 秒
                wait_time = 2 ** attempt
                time.sleep(wait_time)
            else:
                logger.error(f"Failed to send notification to user {user_id} after {max_retries} attempts")
                return False

    return False


def send_notification_stub(user_id: UUID, message: str) -> bool:
    """
    Stub 实现：如果通知系统不存在，先打印到 console

    这样不会阻塞开发
    """
    print(f"[NOTIFICATION STUB] To user {user_id}: {message}")
    logger.info(f"[STUB] Notification to user {user_id}: {message}")
    return True
