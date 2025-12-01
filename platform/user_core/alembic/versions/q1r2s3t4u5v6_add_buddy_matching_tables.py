"""Add buddy matching tables (CASI skill profiles, match cache) and skill_level to users

Revision ID: q1r2s3t4u5v6
Revises: p9q0r1s2t3u4
Create Date: 2025-12-01 10:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = 'q1r2s3t4u5v6'
down_revision: Union[str, Sequence[str], None] = 'p9q0r1s2t3u4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema - add buddy matching tables and skill_level to users."""

    # 1. Add skill_level column to user_profiles table
    op.add_column('user_profiles',
        sa.Column('skill_level', sa.String(length=20), nullable=True, server_default='beginner')
    )
    op.create_index('idx_users_skill_level', 'user_profiles', ['skill_level'])

    # 2. Create casi_skill_profiles table
    op.create_table('casi_skill_profiles',
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('stance_balance', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('rotation', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('edging', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('pressure', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('timing_coordination', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.CheckConstraint(
            'stance_balance >= 0 AND stance_balance <= 1',
            name='check_stance_balance_range'
        ),
        sa.CheckConstraint(
            'rotation >= 0 AND rotation <= 1',
            name='check_rotation_range'
        ),
        sa.CheckConstraint(
            'edging >= 0 AND edging <= 1',
            name='check_edging_range'
        ),
        sa.CheckConstraint(
            'pressure >= 0 AND pressure <= 1',
            name='check_pressure_range'
        ),
        sa.CheckConstraint(
            'timing_coordination >= 0 AND timing_coordination <= 1',
            name='check_timing_coordination_range'
        ),
        sa.ForeignKeyConstraint(['user_id'], ['user_profiles.user_id'], ),
        sa.PrimaryKeyConstraint('user_id')
    )

    # 3. Create match_search_cache table
    op.create_table('match_search_cache',
        sa.Column('search_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('trip_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('results', postgresql.JSON(astext_type=sa.Text()), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('expires_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['trip_id'], ['trips.trip_id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['user_profiles.user_id'], ),
        sa.PrimaryKeyConstraint('search_id')
    )
    op.create_index('idx_match_cache_trip', 'match_search_cache', ['trip_id'])
    op.create_index('idx_match_cache_user', 'match_search_cache', ['user_id'])
    op.create_index('idx_match_cache_expires', 'match_search_cache', ['expires_at'])


def downgrade() -> None:
    """Downgrade schema - remove buddy matching tables and skill_level from users."""

    # Drop match_search_cache table
    op.drop_index('idx_match_cache_expires', table_name='match_search_cache')
    op.drop_index('idx_match_cache_user', table_name='match_search_cache')
    op.drop_index('idx_match_cache_trip', table_name='match_search_cache')
    op.drop_table('match_search_cache')

    # Drop casi_skill_profiles table
    op.drop_table('casi_skill_profiles')

    # Drop skill_level column from user_profiles
    op.drop_index('idx_users_skill_level', table_name='user_profiles')
    op.drop_column('user_profiles', 'skill_level')
