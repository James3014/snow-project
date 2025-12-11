import datetime as dt
import uuid
import pytest

from platform.user_core.domain.calendar.trip import Trip, TripVisibility, TripStatus


def test_trip_default_values():
    trip = Trip.create(
        user_id=uuid.uuid4(),
        title="測試行程",
        start_date=dt.datetime(2025, 1, 1, tzinfo=dt.timezone.utc),
        end_date=dt.datetime(2025, 1, 5, tzinfo=dt.timezone.utc),
    )

    assert trip.visibility == TripVisibility.PRIVATE
    assert trip.status == TripStatus.PLANNING
    assert trip.timezone == "Asia/Taipei"


def test_trip_rejects_end_before_start():
    with pytest.raises(ValueError):
        Trip.create(
            user_id=uuid.uuid4(),
            title="bad trip",
            start_date=dt.datetime(2025, 1, 5, tzinfo=dt.timezone.utc),
            end_date=dt.datetime(2025, 1, 2, tzinfo=dt.timezone.utc),
        )
