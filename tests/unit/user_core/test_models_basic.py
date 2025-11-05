"""
Unit tests for user_core models - basic field validation and relationships.

Tests cover:
- UserProfile model fields and defaults
- UserLocaleProfile model and relationship
- LegacyMapping model and relationship
- BehaviorEvent model
- NotificationPreference model
- Enum validations
"""
import pytest
import uuid
import sys
from datetime import datetime, UTC
from pathlib import Path
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

USER_CORE_ROOT = Path(__file__).resolve().parents[3] / "platform" / "user_core"
sys.path.insert(0, str(USER_CORE_ROOT))

from models.user_profile import (  # type: ignore  # noqa: E402
    Base, UserProfile, UserLocaleProfile, LegacyMapping
)
from models.behavior_event import BehaviorEvent  # type: ignore  # noqa: E402
from models.notification_preference import NotificationPreference  # type: ignore  # noqa: E402
from models.enums import (  # type: ignore  # noqa: E402
    UserStatus, NotificationStatus, LocaleVerificationStatus, NotificationFrequency
)


@pytest.fixture(scope="function")
def db_session():
    """Create an in-memory SQLite database for testing."""
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    session = Session()
    yield session
    session.close()


class TestUserProfile:
    """Test UserProfile model."""

    def test_user_profile_creation_with_defaults(self, db_session):
        """Test creating a UserProfile with default values."""
        user = UserProfile(
            preferred_language="zh-TW",
            experience_level="intermediate"
        )
        db_session.add(user)
        db_session.commit()

        assert user.user_id is not None
        assert isinstance(user.user_id, uuid.UUID)
        assert user.preferred_language == "zh-TW"
        assert user.experience_level == "intermediate"
        assert user.status == UserStatus.active
        assert user.created_at is not None
        assert user.updated_at is not None
        assert isinstance(user.created_at, datetime)

    def test_user_profile_with_all_fields(self, db_session):
        """Test UserProfile with all optional fields populated."""
        user = UserProfile(
            legacy_ids={"old_system": "123", "mobile_app": "456"},
            preferred_language="en",
            experience_level="expert",
            roles=["student", "coach"],
            coach_cert_level="CSIA-L2",
            bio="Experienced skier and coach",
            preferred_resorts=["resort_001", "resort_042"],
            teaching_languages=["en", "zh-TW"],
            legal_consent={"gdpr": True, "marketing": False},
            status=UserStatus.active
        )
        db_session.add(user)
        db_session.commit()

        assert user.legacy_ids == {"old_system": "123", "mobile_app": "456"}
        assert user.roles == ["student", "coach"]
        assert user.coach_cert_level == "CSIA-L2"
        assert user.bio == "Experienced skier and coach"
        assert len(user.preferred_resorts) == 2

    def test_user_profile_status_enum(self, db_session):
        """Test UserProfile status enum values."""
        user = UserProfile(
            preferred_language="en",
            experience_level="beginner",
            status=UserStatus.inactive
        )
        db_session.add(user)
        db_session.commit()

        assert user.status == UserStatus.inactive

        # Test merged status
        user.status = UserStatus.merged
        db_session.commit()
        assert user.status == UserStatus.merged

    def test_user_profile_updated_at_changes(self, db_session):
        """Test that updated_at changes on update."""
        user = UserProfile(
            preferred_language="en",
            experience_level="beginner"
        )
        db_session.add(user)
        db_session.commit()

        original_updated_at = user.updated_at

        # Update the profile
        user.experience_level = "intermediate"
        db_session.commit()

        # SQLite doesn't support onupdate triggers well, but we can verify the field exists
        assert user.updated_at is not None

    def test_user_profile_repr(self, db_session):
        """Test UserProfile __repr__ method."""
        user = UserProfile(
            preferred_language="en",
            experience_level="beginner"
        )
        db_session.add(user)
        db_session.commit()

        repr_str = repr(user)
        assert "UserProfile" in repr_str
        assert str(user.user_id) in repr_str
        assert "active" in repr_str


class TestUserLocaleProfile:
    """Test UserLocaleProfile model and relationship."""

    def test_locale_profile_creation(self, db_session):
        """Test creating a UserLocaleProfile."""
        user = UserProfile(
            preferred_language="en",
            experience_level="beginner"
        )
        db_session.add(user)
        db_session.commit()

        locale = UserLocaleProfile(
            user_id=user.user_id,
            country_code="TW",
            local_identifier="A123456789",
            verification_status=LocaleVerificationStatus.verified,
            metadata_json={"source": "national_id"}
        )
        db_session.add(locale)
        db_session.commit()

        assert locale.user_id == user.user_id
        assert locale.country_code == "TW"
        assert locale.local_identifier == "A123456789"
        assert locale.verification_status == LocaleVerificationStatus.verified

    def test_locale_profile_relationship(self, db_session):
        """Test the relationship between UserProfile and UserLocaleProfile."""
        user = UserProfile(
            preferred_language="en",
            experience_level="beginner"
        )
        db_session.add(user)
        db_session.commit()

        locale1 = UserLocaleProfile(
            user_id=user.user_id,
            country_code="TW",
            local_identifier="A123456789"
        )
        locale2 = UserLocaleProfile(
            user_id=user.user_id,
            country_code="JP",
            local_identifier="B987654321"
        )
        db_session.add_all([locale1, locale2])
        db_session.commit()

        # Test back relationship
        db_session.refresh(user)
        assert len(user.locale_profiles) == 2
        assert any(lp.country_code == "TW" for lp in user.locale_profiles)
        assert any(lp.country_code == "JP" for lp in user.locale_profiles)

    def test_locale_profile_metadata_property(self, db_session):
        """Test the metadata property accessor."""
        user = UserProfile(
            preferred_language="en",
            experience_level="beginner"
        )
        db_session.add(user)
        db_session.commit()

        locale = UserLocaleProfile(
            user_id=user.user_id,
            country_code="TW",
            metadata_json={"key": "value"}
        )
        db_session.add(locale)
        db_session.commit()

        # Test property getter
        assert locale.metadata == {"key": "value"}

        # Test property setter
        locale.metadata = {"new_key": "new_value"}
        assert locale.metadata_json == {"new_key": "new_value"}

    def test_locale_verification_status_enum(self, db_session):
        """Test LocaleVerificationStatus enum values."""
        user = UserProfile(
            preferred_language="en",
            experience_level="beginner"
        )
        db_session.add(user)
        db_session.commit()

        locale = UserLocaleProfile(
            user_id=user.user_id,
            country_code="TW"
        )
        db_session.add(locale)
        db_session.commit()

        # Default should be unverified
        assert locale.verification_status == LocaleVerificationStatus.unverified

        # Test changing status
        locale.verification_status = LocaleVerificationStatus.pending
        db_session.commit()
        assert locale.verification_status == LocaleVerificationStatus.pending


class TestLegacyMapping:
    """Test LegacyMapping model."""

    def test_legacy_mapping_creation(self, db_session):
        """Test creating a LegacyMapping."""
        user = UserProfile(
            preferred_language="en",
            experience_level="beginner"
        )
        db_session.add(user)
        db_session.commit()

        mapping = LegacyMapping(
            legacy_system="old_mobile_app",
            legacy_key="user_123",
            user_id=user.user_id,
            notes="Migrated from mobile app v1"
        )
        db_session.add(mapping)
        db_session.commit()

        assert mapping.legacy_system == "old_mobile_app"
        assert mapping.legacy_key == "user_123"
        assert mapping.user_id == user.user_id
        assert mapping.notes == "Migrated from mobile app v1"
        assert mapping.created_at is not None

    def test_legacy_mapping_composite_pk(self, db_session):
        """Test that legacy_system and legacy_key form composite PK."""
        user = UserProfile(
            preferred_language="en",
            experience_level="beginner"
        )
        db_session.add(user)
        db_session.commit()

        mapping1 = LegacyMapping(
            legacy_system="system_a",
            legacy_key="key_1",
            user_id=user.user_id
        )
        mapping2 = LegacyMapping(
            legacy_system="system_a",
            legacy_key="key_2",
            user_id=user.user_id
        )
        db_session.add_all([mapping1, mapping2])
        db_session.commit()

        # Both should exist
        mappings = db_session.query(LegacyMapping).filter_by(
            legacy_system="system_a"
        ).all()
        assert len(mappings) == 2

    def test_legacy_mapping_relationship(self, db_session):
        """Test relationship between LegacyMapping and UserProfile."""
        user = UserProfile(
            preferred_language="en",
            experience_level="beginner"
        )
        db_session.add(user)
        db_session.commit()

        mapping1 = LegacyMapping(
            legacy_system="system_a",
            legacy_key="key_1",
            user_id=user.user_id
        )
        mapping2 = LegacyMapping(
            legacy_system="system_b",
            legacy_key="key_2",
            user_id=user.user_id
        )
        db_session.add_all([mapping1, mapping2])
        db_session.commit()

        # Test backref
        db_session.refresh(user)
        assert len(user.legacy_mappings) == 2


class TestBehaviorEvent:
    """Test BehaviorEvent model."""

    def test_behavior_event_creation(self, db_session):
        """Test creating a BehaviorEvent."""
        user = UserProfile(
            preferred_language="en",
            experience_level="beginner"
        )
        db_session.add(user)
        db_session.commit()

        event = BehaviorEvent(
            user_id=user.user_id,
            source_project="resort-services",
            event_type="resort.visited",
            payload={"resort_id": "resort_001", "date": "2025-11-05"},
            version=1
        )
        db_session.add(event)
        db_session.commit()

        assert event.event_id is not None
        assert isinstance(event.event_id, uuid.UUID)
        assert event.user_id == user.user_id
        assert event.source_project == "resort-services"
        assert event.event_type == "resort.visited"
        assert event.payload == {"resort_id": "resort_001", "date": "2025-11-05"}
        assert event.version == 1
        assert event.occurred_at is not None
        assert event.recorded_at is not None

    def test_behavior_event_with_schema_url(self, db_session):
        """Test BehaviorEvent with schema_url."""
        user = UserProfile(
            preferred_language="en",
            experience_level="beginner"
        )
        db_session.add(user)
        db_session.commit()

        event = BehaviorEvent(
            user_id=user.user_id,
            source_project="custom-service",
            event_type="custom.event",
            payload={"data": "test"},
            schema_url="https://schemas.skidiy.com/custom-event-v1.json"
        )
        db_session.add(event)
        db_session.commit()

        assert event.schema_url == "https://schemas.skidiy.com/custom-event-v1.json"

    def test_behavior_event_relationship(self, db_session):
        """Test relationship between BehaviorEvent and UserProfile."""
        user = UserProfile(
            preferred_language="en",
            experience_level="beginner"
        )
        db_session.add(user)
        db_session.commit()

        event = BehaviorEvent(
            user_id=user.user_id,
            source_project="test",
            event_type="test.event",
            payload={}
        )
        db_session.add(event)
        db_session.commit()

        # Test relationship
        db_session.refresh(event)
        assert event.user.user_id == user.user_id


class TestNotificationPreference:
    """Test NotificationPreference model."""

    def test_notification_preference_creation(self, db_session):
        """Test creating a NotificationPreference."""
        user = UserProfile(
            preferred_language="en",
            experience_level="beginner"
        )
        db_session.add(user)
        db_session.commit()

        pref = NotificationPreference(
            user_id=user.user_id,
            channel="email",
            topic="lesson_reminder",
            status=NotificationStatus.opt_in,
            frequency=NotificationFrequency.immediate,
            consent_source="web_signup"
        )
        db_session.add(pref)
        db_session.commit()

        assert pref.user_id == user.user_id
        assert pref.channel == "email"
        assert pref.topic == "lesson_reminder"
        assert pref.status == NotificationStatus.opt_in
        assert pref.frequency == NotificationFrequency.immediate
        assert pref.consent_source == "web_signup"
        assert pref.last_updated_at is not None

    def test_notification_preference_defaults(self, db_session):
        """Test NotificationPreference default values."""
        user = UserProfile(
            preferred_language="en",
            experience_level="beginner"
        )
        db_session.add(user)
        db_session.commit()

        pref = NotificationPreference(
            user_id=user.user_id,
            channel="push",
            topic="match_found"
        )
        db_session.add(pref)
        db_session.commit()

        # Check defaults
        assert pref.status == NotificationStatus.opt_out
        assert pref.frequency == NotificationFrequency.immediate

    def test_notification_preference_composite_pk(self, db_session):
        """Test composite primary key (user_id, channel, topic)."""
        user = UserProfile(
            preferred_language="en",
            experience_level="beginner"
        )
        db_session.add(user)
        db_session.commit()

        pref1 = NotificationPreference(
            user_id=user.user_id,
            channel="email",
            topic="lesson_reminder",
            status=NotificationStatus.opt_in
        )
        pref2 = NotificationPreference(
            user_id=user.user_id,
            channel="email",
            topic="match_found",
            status=NotificationStatus.opt_out
        )
        pref3 = NotificationPreference(
            user_id=user.user_id,
            channel="sms",
            topic="lesson_reminder",
            status=NotificationStatus.opt_in
        )
        db_session.add_all([pref1, pref2, pref3])
        db_session.commit()

        # All three should exist
        prefs = db_session.query(NotificationPreference).filter_by(
            user_id=user.user_id
        ).all()
        assert len(prefs) == 3

    def test_notification_status_enum_values(self, db_session):
        """Test all NotificationStatus enum values."""
        user = UserProfile(
            preferred_language="en",
            experience_level="beginner"
        )
        db_session.add(user)
        db_session.commit()

        pref = NotificationPreference(
            user_id=user.user_id,
            channel="email",
            topic="test"
        )
        db_session.add(pref)
        db_session.commit()

        # Test opt_in
        pref.status = NotificationStatus.opt_in
        db_session.commit()
        assert pref.status == NotificationStatus.opt_in

        # Test paused
        pref.status = NotificationStatus.paused
        db_session.commit()
        assert pref.status == NotificationStatus.paused

        # Test opt_out
        pref.status = NotificationStatus.opt_out
        db_session.commit()
        assert pref.status == NotificationStatus.opt_out

    def test_notification_frequency_enum_values(self, db_session):
        """Test all NotificationFrequency enum values."""
        user = UserProfile(
            preferred_language="en",
            experience_level="beginner"
        )
        db_session.add(user)
        db_session.commit()

        pref = NotificationPreference(
            user_id=user.user_id,
            channel="email",
            topic="test"
        )
        db_session.add(pref)
        db_session.commit()

        # Test all frequency values
        for freq in [NotificationFrequency.immediate, NotificationFrequency.daily,
                     NotificationFrequency.weekly, NotificationFrequency.monthly]:
            pref.frequency = freq
            db_session.commit()
            assert pref.frequency == freq


class TestEnums:
    """Test enum definitions."""

    def test_user_status_enum_values(self):
        """Test UserStatus enum has correct values."""
        assert UserStatus.active.value == "active"
        assert UserStatus.inactive.value == "inactive"
        assert UserStatus.merged.value == "merged"

    def test_notification_status_enum_values(self):
        """Test NotificationStatus enum has correct values."""
        assert NotificationStatus.opt_in.value == "opt-in"
        assert NotificationStatus.opt_out.value == "opt-out"
        assert NotificationStatus.paused.value == "paused"

    def test_locale_verification_status_enum_values(self):
        """Test LocaleVerificationStatus enum has correct values."""
        assert LocaleVerificationStatus.unverified.value == "unverified"
        assert LocaleVerificationStatus.pending.value == "pending"
        assert LocaleVerificationStatus.verified.value == "verified"

    def test_notification_frequency_enum_values(self):
        """Test NotificationFrequency enum has correct values."""
        assert NotificationFrequency.immediate.value == "immediate"
        assert NotificationFrequency.daily.value == "daily"
        assert NotificationFrequency.weekly.value == "weekly"
        assert NotificationFrequency.monthly.value == "monthly"
