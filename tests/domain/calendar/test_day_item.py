import datetime as dt
import uuid

import pytest

from platform.user_core.domain.calendar.day import Day
from platform.user_core.domain.calendar.item import Item


def test_day_requires_nonnegative_index():
    with pytest.raises(ValueError):
        Day.create(trip_id=uuid.uuid4(), day_index=-1, label="bad")


def test_item_validates_times():
    day_id = uuid.uuid4()
    trip_id = uuid.uuid4()
    with pytest.raises(ValueError):
        Item.create(
            day_id=day_id,
            trip_id=trip_id,
            type="ski",
            title="invalid",
            start_time=dt.datetime(2025, 1, 1, 10, tzinfo=dt.timezone.utc),
            end_time=dt.datetime(2025, 1, 1, 9, tzinfo=dt.timezone.utc),
        )
