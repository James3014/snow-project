"""
Test Calendar Enums - GEAR Event Type
"""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../../platform/user_core'))

import pytest
from domain.calendar.enums import EventType


class TestEventType:
    """Test EventType enum includes GEAR type."""

    def test_gear_event_type_exists(self):
        """Test that GEAR event type exists."""
        assert EventType.GEAR == "GEAR"

    def test_all_event_types_available(self):
        """Test all expected event types are available."""
        expected_types = ["TRIP", "REMINDER", "MATCHING", "GEAR", "AVAILABILITY", "MEETING", "EXTERNAL"]
        
        for event_type in expected_types:
            assert hasattr(EventType, event_type)
            assert getattr(EventType, event_type) == event_type
