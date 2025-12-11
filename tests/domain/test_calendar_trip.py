"""
TDD: Trip Domain Tests
TODO-CAL-001
"""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../../platform/user_core'))

import pytest
import uuid
from datetime import datetime, timezone, timedelta

from domain.calendar.trip import Trip
from domain.calendar.enums import TripVisibility, TripStatus


class TestTripCreate:
    """測試 Trip.create() 工廠方法"""

    def test_create_minimal_trip(self):
        """最小必要欄位建立行程"""
        user_id = uuid.uuid4()
        start = datetime.now(timezone.utc)
        end = start + timedelta(days=3)

        trip = Trip.create(
            user_id=user_id,
            title="苗場滑雪",
            start_date=start,
            end_date=end,
        )

        assert trip.user_id == user_id
        assert trip.title == "苗場滑雪"
        assert trip.start_date == start
        assert trip.end_date == end
        assert trip.visibility == TripVisibility.PRIVATE
        assert trip.status == TripStatus.PLANNING
        assert trip.max_buddies == 1
        assert trip.current_buddies == 0

    def test_create_with_all_fields(self):
        """完整欄位建立行程"""
        user_id = uuid.uuid4()
        start = datetime.now(timezone.utc)
        end = start + timedelta(days=5)

        trip = Trip.create(
            user_id=user_id,
            title="二世谷團",
            start_date=start,
            end_date=end,
            timezone="Asia/Tokyo",
            visibility=TripVisibility.PUBLIC,
            status=TripStatus.CONFIRMED,
            template_id="niseko_5d",
            resort_id="niseko",
            resort_name="二世谷",
            region="北海道",
            people_count=4,
            note="帶初學者",
            max_buddies=3,
        )

        assert trip.template_id == "niseko_5d"
        assert trip.resort_id == "niseko"
        assert trip.visibility == TripVisibility.PUBLIC
        assert trip.max_buddies == 3

    def test_create_fails_when_end_before_start(self):
        """結束日期早於開始日期應失敗"""
        user_id = uuid.uuid4()
        start = datetime.now(timezone.utc)
        end = start - timedelta(days=1)

        with pytest.raises(ValueError, match="end_date must be >= start_date"):
            Trip.create(
                user_id=user_id,
                title="錯誤行程",
                start_date=start,
                end_date=end,
            )

    def test_create_fails_when_dates_not_timezone_aware(self):
        """日期必須有時區"""
        user_id = uuid.uuid4()
        start = datetime.now()  # naive datetime
        end = start + timedelta(days=3)

        with pytest.raises(ValueError, match="timezone-aware"):
            Trip.create(
                user_id=user_id,
                title="無時區行程",
                start_date=start,
                end_date=end,
            )

    def test_create_fails_when_max_buddies_less_than_1(self):
        """max_buddies 必須 >= 1"""
        user_id = uuid.uuid4()
        start = datetime.now(timezone.utc)
        end = start + timedelta(days=3)

        with pytest.raises(ValueError, match="max_buddies must be >= 1"):
            Trip.create(
                user_id=user_id,
                title="錯誤行程",
                start_date=start,
                end_date=end,
                max_buddies=0,
            )


class TestTripUpdate:
    """測試 Trip.update() 方法"""

    def _create_trip(self):
        return Trip.create(
            user_id=uuid.uuid4(),
            title="原始行程",
            start_date=datetime.now(timezone.utc),
            end_date=datetime.now(timezone.utc) + timedelta(days=3),
            max_buddies=2,
        )

    def test_update_title(self):
        """更新標題"""
        trip = self._create_trip()
        updated = trip.update(title="新標題")

        assert updated.title == "新標題"
        assert updated.id == trip.id  # ID 不變

    def test_update_dates(self):
        """更新日期"""
        trip = self._create_trip()
        new_start = datetime.now(timezone.utc) + timedelta(days=7)
        new_end = new_start + timedelta(days=5)

        updated = trip.update(start_date=new_start, end_date=new_end)

        assert updated.start_date == new_start
        assert updated.end_date == new_end

    def test_update_fails_when_end_before_start(self):
        """更新後結束日期早於開始日期應失敗"""
        trip = self._create_trip()
        new_end = trip.start_date - timedelta(days=1)

        with pytest.raises(ValueError, match="end_date must be >= start_date"):
            trip.update(end_date=new_end)

    def test_update_max_buddies(self):
        """更新 max_buddies"""
        trip = self._create_trip()
        updated = trip.update(max_buddies=5)

        assert updated.max_buddies == 5

    def test_update_fails_when_max_buddies_less_than_1(self):
        """更新 max_buddies < 1 應失敗"""
        trip = self._create_trip()

        with pytest.raises(ValueError, match="max_buddies must be >= 1"):
            trip.update(max_buddies=0)

    def test_update_preserves_unchanged_fields(self):
        """未更新的欄位應保持不變"""
        trip = self._create_trip()
        updated = trip.update(title="新標題")

        assert updated.max_buddies == trip.max_buddies
        assert updated.start_date == trip.start_date
        assert updated.visibility == trip.visibility


class TestTripFromPersistence:
    """測試 Trip.from_persistence() 方法"""

    def test_from_persistence(self):
        """從持久化資料重建 Trip"""
        trip_id = uuid.uuid4()
        user_id = uuid.uuid4()
        start = datetime.now(timezone.utc)
        end = start + timedelta(days=3)

        trip = Trip.from_persistence(
            id=trip_id,
            user_id=user_id,
            title="持久化行程",
            start_date=start,
            end_date=end,
            timezone="Asia/Taipei",
            visibility=TripVisibility.PUBLIC,
            status=TripStatus.COMPLETED,
            template_id="template_1",
            resort_id="hakuba",
            resort_name="白馬",
            region="長野",
            people_count=2,
            note="測試",
            max_buddies=4,
            current_buddies=2,
        )

        assert trip.id == trip_id
        assert trip.user_id == user_id
        assert trip.current_buddies == 2
