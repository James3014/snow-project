"""add calendar tables

Revision ID: 202502150001
Revises: 202502120001
Create Date: 2025-02-15 00:01:00.000000
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from domain.calendar.enums import (
    TripVisibility,
    TripStatus,
    EventType,
    BuddyStatus,
    BuddyRole,
    MatchingStatus,
)

# revision identifiers, used by Alembic.
revision = "202502150001"
down_revision = "202502120001"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "calendar_trips",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("user_profiles.user_id"), nullable=False),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("template_id", sa.String(length=100)),
        sa.Column("start_date", sa.DateTime(timezone=True), nullable=False),
        sa.Column("end_date", sa.DateTime(timezone=True), nullable=False),
        sa.Column("timezone", sa.String(length=64), nullable=False, server_default="Asia/Taipei"),
        sa.Column("visibility", sa.Enum(TripVisibility, native_enum=False), nullable=False, server_default=TripVisibility.PRIVATE.value),
        sa.Column("status", sa.Enum(TripStatus, native_enum=False), nullable=False, server_default=TripStatus.PLANNING.value),
        sa.Column("resort_id", sa.String(length=100)),
        sa.Column("resort_name", sa.String(length=200)),
        sa.Column("region", sa.String(length=100)),
        sa.Column("people_count", sa.Integer()),
        sa.Column("note", sa.Text()),
        sa.Column("max_buddies", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("current_buddies", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
    )
    op.create_index("idx_calendar_trips_user", "calendar_trips", ["user_id"])
    op.create_index("idx_calendar_trips_date", "calendar_trips", ["start_date", "end_date"])

    op.create_table(
        "calendar_days",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("trip_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("calendar_trips.id", ondelete="CASCADE"), nullable=False),
        sa.Column("day_index", sa.Integer(), nullable=False),
        sa.Column("label", sa.String(length=100), nullable=False),
        sa.Column("city", sa.String(length=100)),
        sa.Column("resort_id", sa.String(length=100)),
        sa.Column("resort_name", sa.String(length=200)),
        sa.Column("region", sa.String(length=100)),
        sa.Column("is_ski_day", sa.Boolean(), nullable=False, server_default=sa.text("false")),
    )
    op.create_index("idx_calendar_days_trip", "calendar_days", ["trip_id"])
    op.create_unique_constraint("uq_calendar_trip_day_index", "calendar_days", ["trip_id", "day_index"])

    op.create_table(
        "calendar_items",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("trip_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("calendar_trips.id", ondelete="CASCADE"), nullable=False),
        sa.Column("day_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("calendar_days.id", ondelete="CASCADE"), nullable=False),
        sa.Column("type", sa.String(length=50), nullable=False),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("start_time", sa.DateTime(timezone=True)),
        sa.Column("end_time", sa.DateTime(timezone=True)),
        sa.Column("time_hint", sa.String(length=50)),
        sa.Column("location", sa.String(length=200)),
        sa.Column("resort_id", sa.String(length=100)),
        sa.Column("resort_name", sa.String(length=200)),
        sa.Column("note", sa.Text()),
    )
    op.create_index("idx_calendar_items_day", "calendar_items", ["day_id"])

    op.create_table(
        "calendar_events",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("user_profiles.user_id"), nullable=False),
        sa.Column("type", sa.Enum(EventType, native_enum=False), nullable=False),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("description", sa.Text()),
        sa.Column("start_date", sa.DateTime(timezone=True), nullable=False),
        sa.Column("end_date", sa.DateTime(timezone=True), nullable=False),
        sa.Column("all_day", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("timezone", sa.String(length=64), nullable=False, server_default="Asia/Taipei"),
        sa.Column("trip_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("calendar_trips.id")),
        sa.Column("resort_id", sa.String(length=100)),
        sa.Column("google_event_id", sa.String(length=128)),
        sa.Column("outlook_event_id", sa.String(length=128)),
        sa.Column("matching_id", postgresql.UUID(as_uuid=True)),
        sa.Column("participants", sa.JSON()),
        sa.Column("reminders", sa.JSON()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
    )
    op.create_index("idx_calendar_events_user_date", "calendar_events", ["user_id", "start_date"])
    op.create_index("idx_calendar_events_type", "calendar_events", ["type", "start_date"])

    op.create_table(
        "calendar_trip_buddies",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("trip_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("calendar_trips.id", ondelete="CASCADE"), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("user_profiles.user_id"), nullable=False),
        sa.Column("inviter_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("user_profiles.user_id"), nullable=False),
        sa.Column("status", sa.Enum(BuddyStatus, native_enum=False), nullable=False, server_default=BuddyStatus.PENDING.value),
        sa.Column("role", sa.Enum(BuddyRole, native_enum=False), nullable=False, server_default=BuddyRole.BUDDY.value),
        sa.Column("request_message", sa.Text()),
        sa.Column("response_message", sa.Text()),
        sa.Column("requested_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.Column("responded_at", sa.DateTime(timezone=True)),
        sa.Column("joined_at", sa.DateTime(timezone=True)),
    )
    op.create_index("idx_calendar_trip_buddies_trip", "calendar_trip_buddies", ["trip_id"])
    op.create_index("idx_calendar_trip_buddies_user", "calendar_trip_buddies", ["user_id"])
    op.create_unique_constraint("uq_calendar_trip_user", "calendar_trip_buddies", ["trip_id", "user_id"])

    op.create_table(
        "calendar_matching_requests",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("trip_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("calendar_trips.id", ondelete="CASCADE"), nullable=False),
        sa.Column("requester_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("user_profiles.user_id"), nullable=False),
        sa.Column("preferences", sa.JSON(), nullable=False),
        sa.Column("status", sa.Enum(MatchingStatus, native_enum=False), nullable=False, server_default=MatchingStatus.PENDING.value),
        sa.Column("results", sa.JSON()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.Column("completed_at", sa.DateTime(timezone=True)),
    )
    op.create_index("idx_calendar_matching_requests_trip", "calendar_matching_requests", ["trip_id"])
    op.create_index("idx_calendar_matching_requests_requester", "calendar_matching_requests", ["requester_id"])


def downgrade():
    op.drop_table("calendar_matching_requests")
    op.drop_table("calendar_trip_buddies")
    op.drop_table("calendar_events")
    op.drop_table("calendar_items")
    op.drop_table("calendar_days")
    op.drop_table("calendar_trips")
