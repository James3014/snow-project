"""
TDD: TripBuddy Domain Tests
TODO-CAL-003
"""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../../platform/user_core'))

import pytest
import uuid
from datetime import datetime, timezone

from domain.calendar.trip_buddy import TripBuddy
from domain.calendar.enums import BuddyStatus, BuddyRole


class TestTripBuddyCreate:
    """測試 TripBuddy 建立"""

    def test_create_buddy_request(self):
        """建立雪伴申請"""
        trip_id = uuid.uuid4()
        user_id = uuid.uuid4()
        inviter_id = uuid.uuid4()

        buddy = TripBuddy(
            trip_id=trip_id,
            user_id=user_id,
            inviter_id=inviter_id,
            request_message="想一起滑雪！",
        )

        assert buddy.trip_id == trip_id
        assert buddy.user_id == user_id
        assert buddy.inviter_id == inviter_id
        assert buddy.status == BuddyStatus.PENDING
        assert buddy.role == BuddyRole.BUDDY
        assert buddy.request_message == "想一起滑雪！"
        assert buddy.responded_at is None
        assert buddy.joined_at is None

    def test_create_with_coach_role(self):
        """建立教練角色"""
        buddy = TripBuddy(
            trip_id=uuid.uuid4(),
            user_id=uuid.uuid4(),
            inviter_id=uuid.uuid4(),
            role=BuddyRole.COACH,
        )

        assert buddy.role == BuddyRole.COACH


class TestTripBuddyAccept:
    """測試接受申請"""

    def _create_pending_buddy(self):
        return TripBuddy(
            trip_id=uuid.uuid4(),
            user_id=uuid.uuid4(),
            inviter_id=uuid.uuid4(),
        )

    def test_accept_sets_status(self):
        """接受後狀態變為 ACCEPTED"""
        buddy = self._create_pending_buddy()
        accepted = buddy.accept()

        assert accepted.status == BuddyStatus.ACCEPTED

    def test_accept_sets_joined_at(self):
        """接受後設定 joined_at"""
        buddy = self._create_pending_buddy()
        accepted = buddy.accept()

        assert accepted.joined_at is not None

    def test_accept_sets_responded_at(self):
        """接受後設定 responded_at"""
        buddy = self._create_pending_buddy()
        accepted = buddy.accept()

        assert accepted.responded_at is not None

    def test_accept_preserves_id(self):
        """接受後 ID 不變"""
        buddy = self._create_pending_buddy()
        accepted = buddy.accept()

        assert accepted.id == buddy.id


class TestTripBuddyDecline:
    """測試拒絕申請"""

    def _create_pending_buddy(self):
        return TripBuddy(
            trip_id=uuid.uuid4(),
            user_id=uuid.uuid4(),
            inviter_id=uuid.uuid4(),
        )

    def test_decline_sets_status(self):
        """拒絕後狀態變為 DECLINED"""
        buddy = self._create_pending_buddy()
        declined = buddy.decline()

        assert declined.status == BuddyStatus.DECLINED

    def test_decline_with_message(self):
        """拒絕時可附帶訊息"""
        buddy = self._create_pending_buddy()
        declined = buddy.decline(message="時間不合")

        assert declined.response_message == "時間不合"

    def test_decline_does_not_set_joined_at(self):
        """拒絕後不設定 joined_at"""
        buddy = self._create_pending_buddy()
        declined = buddy.decline()

        assert declined.joined_at is None

    def test_decline_sets_responded_at(self):
        """拒絕後設定 responded_at"""
        buddy = self._create_pending_buddy()
        declined = buddy.decline()

        assert declined.responded_at is not None
