"""Add trip planning tables (seasons, trips, buddies, shares)

Revision ID: n7o8p9q0r1s2
Revises: m1n2o3p4q5r6
Create Date: 2025-11-07 12:30:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = 'n7o8p9q0r1s2'
down_revision: Union[str, Sequence[str], None] = 'm1n2o3p4q5r6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema - add trip planning tables."""

    # 1. Create seasons table
    op.create_table('seasons',
        sa.Column('season_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('title', sa.String(length=100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('start_date', sa.Date(), nullable=False),
        sa.Column('end_date', sa.Date(), nullable=False),
        sa.Column('goal_trips', sa.Integer(), nullable=True),
        sa.Column('goal_resorts', sa.Integer(), nullable=True),
        sa.Column('goal_courses', sa.Integer(), nullable=True),
        sa.Column('status', sa.String(length=20), nullable=False, server_default='active'),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.CheckConstraint('start_date <= end_date', name='check_season_date_range'),
        sa.ForeignKeyConstraint(['user_id'], ['user_profiles.user_id'], ),
        sa.PrimaryKeyConstraint('season_id')
    )
    op.create_index('idx_seasons_user', 'seasons', ['user_id'])
    op.create_index('idx_seasons_user_status', 'seasons', ['user_id', 'status'])

    # 2. Create trips table
    op.create_table('trips',
        sa.Column('trip_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('season_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('resort_id', sa.String(length=100), nullable=False),
        sa.Column('title', sa.String(length=200), nullable=True),
        sa.Column('start_date', sa.Date(), nullable=False),
        sa.Column('end_date', sa.Date(), nullable=False),
        sa.Column('flexibility', sa.String(length=30), nullable=False, server_default='fixed'),
        sa.Column('flight_status', sa.String(length=30), nullable=False, server_default='not_planned'),
        sa.Column('accommodation_status', sa.String(length=30), nullable=False, server_default='not_planned'),
        sa.Column('trip_status', sa.String(length=20), nullable=False, server_default='planning'),
        sa.Column('visibility', sa.String(length=20), nullable=False, server_default='private'),
        sa.Column('share_token', sa.String(length=64), nullable=True),
        sa.Column('max_buddies', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('current_buddies', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('completed_at', sa.DateTime(), nullable=True),
        sa.Column('course_visit_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.CheckConstraint('start_date <= end_date', name='check_trip_date_range'),
        sa.CheckConstraint('max_buddies >= 0', name='check_max_buddies'),
        sa.CheckConstraint('current_buddies >= 0', name='check_current_buddies'),
        sa.ForeignKeyConstraint(['season_id'], ['seasons.season_id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['user_profiles.user_id'], ),
        sa.PrimaryKeyConstraint('trip_id'),
        sa.UniqueConstraint('share_token')
    )
    op.create_index('idx_trips_user', 'trips', ['user_id'])
    op.create_index('idx_trips_season', 'trips', ['season_id'])
    op.create_index('idx_trips_resort', 'trips', ['resort_id'])
    op.create_index('idx_trips_user_status', 'trips', ['user_id', 'trip_status'])
    op.create_index('idx_trips_visibility', 'trips', ['visibility'])
    op.create_index('idx_trips_date_range', 'trips', ['start_date', 'end_date'])

    # 3. Create trip_buddies table
    op.create_table('trip_buddies',
        sa.Column('buddy_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('trip_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('role', sa.String(length=20), nullable=False, server_default='buddy'),
        sa.Column('status', sa.String(length=20), nullable=False, server_default='pending'),
        sa.Column('request_message', sa.Text(), nullable=True),
        sa.Column('response_message', sa.Text(), nullable=True),
        sa.Column('requested_at', sa.DateTime(), nullable=False),
        sa.Column('responded_at', sa.DateTime(), nullable=True),
        sa.Column('joined_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['trip_id'], ['trips.trip_id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['user_profiles.user_id'], ),
        sa.PrimaryKeyConstraint('buddy_id'),
        sa.UniqueConstraint('trip_id', 'user_id', name='uq_trip_user_buddy')
    )
    op.create_index('idx_trip_buddies_trip', 'trip_buddies', ['trip_id'])
    op.create_index('idx_trip_buddies_user', 'trip_buddies', ['user_id'])
    op.create_index('idx_trip_buddies_status', 'trip_buddies', ['status'])

    # 4. Create trip_shares table
    op.create_table('trip_shares',
        sa.Column('share_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('trip_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('shared_with_user_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('shared_with_email', sa.String(length=255), nullable=True),
        sa.Column('can_edit', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('can_invite_buddies', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('expires_at', sa.DateTime(), nullable=True),
        sa.CheckConstraint(
            '(shared_with_user_id IS NOT NULL OR shared_with_email IS NOT NULL)',
            name='check_share_recipient'
        ),
        sa.ForeignKeyConstraint(['trip_id'], ['trips.trip_id'], ),
        sa.ForeignKeyConstraint(['shared_with_user_id'], ['user_profiles.user_id'], ),
        sa.PrimaryKeyConstraint('share_id')
    )
    op.create_index('idx_trip_shares_trip', 'trip_shares', ['trip_id'])
    op.create_index('idx_trip_shares_user', 'trip_shares', ['shared_with_user_id'])
    op.create_index('idx_trip_shares_email', 'trip_shares', ['shared_with_email'])


def downgrade() -> None:
    """Downgrade schema - remove trip planning tables."""

    op.drop_index('idx_trip_shares_email', table_name='trip_shares')
    op.drop_index('idx_trip_shares_user', table_name='trip_shares')
    op.drop_index('idx_trip_shares_trip', table_name='trip_shares')
    op.drop_table('trip_shares')

    op.drop_index('idx_trip_buddies_status', table_name='trip_buddies')
    op.drop_index('idx_trip_buddies_user', table_name='trip_buddies')
    op.drop_index('idx_trip_buddies_trip', table_name='trip_buddies')
    op.drop_table('trip_buddies')

    op.drop_index('idx_trips_date_range', table_name='trips')
    op.drop_index('idx_trips_visibility', table_name='trips')
    op.drop_index('idx_trips_user_status', table_name='trips')
    op.drop_index('idx_trips_resort', table_name='trips')
    op.drop_index('idx_trips_season', table_name='trips')
    op.drop_index('idx_trips_user', table_name='trips')
    op.drop_table('trips')

    op.drop_index('idx_seasons_user_status', table_name='seasons')
    op.drop_index('idx_seasons_user', table_name='seasons')
    op.drop_table('seasons')
