"""
Send Gear Reminders Job

Linus 原则：用最简单的方式实现定时提醒

用法：
    python jobs/send_reminders.py

Cron 设置（每小时运行）：
    0 * * * * cd /path/to/gear_ops && python jobs/send_reminders.py
"""
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from datetime import datetime
from sqlalchemy import and_
import logging

from models import GearReminder, GearItem
from services.db import get_db_context
from integrations.notification import send_notification, send_notification_stub
from schemas import REMINDER_STATUS_PENDING, REMINDER_STATUS_SENT

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def send_pending_reminders(use_stub: bool = True):
    """
    发送待发送的提醒

    逻辑：
    1. 查询所有 status='pending' AND scheduled_at <= NOW()
    2. 对每个提醒发送通知
    3. 更新 sent_at 和 status='sent'
    4. 失败的记录日志但不重试太多次
    """
    with get_db_context() as db:
        # 查询待发送的提醒
        now = datetime.now()
        pending_reminders = db.query(GearReminder).filter(
            and_(
                GearReminder.status == REMINDER_STATUS_PENDING,
                GearReminder.scheduled_at <= now
            )
        ).all()

        logger.info(f"Found {len(pending_reminders)} reminders to send")

        success_count = 0
        fail_count = 0

        for reminder in pending_reminders:
            try:
                # 获取装备信息以找到 user_id
                gear_item = db.query(GearItem).filter(
                    GearItem.id == reminder.gear_item_id
                ).first()

                if not gear_item:
                    logger.warning(f"Gear item {reminder.gear_item_id} not found, skipping reminder {reminder.id}")
                    continue

                # 发送通知
                message = reminder.message or f"Reminder for your gear: {gear_item.name}"

                if use_stub:
                    success = send_notification_stub(gear_item.user_id, message)
                else:
                    success = send_notification(gear_item.user_id, message)

                if success:
                    # 更新提醒状态
                    reminder.status = REMINDER_STATUS_SENT
                    reminder.sent_at = now
                    success_count += 1
                    logger.info(f"Sent reminder {reminder.id} to user {gear_item.user_id}")
                else:
                    fail_count += 1
                    logger.error(f"Failed to send reminder {reminder.id}")

            except Exception as e:
                fail_count += 1
                logger.error(f"Error sending reminder {reminder.id}: {e}")

        # Commit 所有更新
        db.commit()

        logger.info(f"Reminder job completed: {success_count} sent, {fail_count} failed")
        return success_count, fail_count


if __name__ == "__main__":
    """
    直接运行此脚本来发送提醒

    可以通过环境变量控制是否使用 stub：
    USE_NOTIFICATION_STUB=false python jobs/send_reminders.py
    """
    use_stub = os.environ.get('USE_NOTIFICATION_STUB', 'true').lower() == 'true'

    logger.info(f"Starting reminder job (use_stub={use_stub})")
    success, failed = send_pending_reminders(use_stub=use_stub)
    logger.info(f"Reminder job finished: {success} sent, {failed} failed")
