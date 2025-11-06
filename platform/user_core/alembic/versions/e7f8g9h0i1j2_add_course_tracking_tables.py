"""Add course tracking tables

Revision ID: e7f8g9h0i1j2
Revises: 6c0a6e77f5a2
Create Date: 2025-11-06 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'e7f8g9h0i1j2'
down_revision: Union[str, Sequence[str], None] = '6c0a6e77f5a2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema - add course tracking tables."""

    # Create course_visits table
    op.create_table('course_visits',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('resort_id', sa.String(length=100), nullable=False),
        sa.Column('course_name', sa.String(length=200), nullable=False),
        sa.Column('visited_date', sa.Date(), nullable=False),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['user_profiles.user_id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'resort_id', 'course_name', 'visited_date',
                          name='uq_user_resort_course_date')
    )
    op.create_index('idx_course_visits_user', 'course_visits', ['user_id'])
    op.create_index('idx_course_visits_resort', 'course_visits', ['resort_id'])
    op.create_index('idx_course_visits_user_resort', 'course_visits', ['user_id', 'resort_id'])

    # Create course_recommendations table
    op.create_table('course_recommendations',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('resort_id', sa.String(length=100), nullable=False),
        sa.Column('course_name', sa.String(length=200), nullable=False),
        sa.Column('rank', sa.Integer(), nullable=False),
        sa.Column('reason', sa.Text(), nullable=True),
        sa.Column('status', sa.String(length=20), nullable=False, server_default='pending_review'),
        sa.Column('reviewed_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('reviewed_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.CheckConstraint('rank >= 1 AND rank <= 3', name='check_rank_range'),
        sa.ForeignKeyConstraint(['user_id'], ['user_profiles.user_id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'resort_id', 'rank', name='uq_user_resort_rank'),
        sa.UniqueConstraint('user_id', 'resort_id', 'course_name', name='uq_user_resort_course')
    )
    op.create_index('idx_recommendations_user', 'course_recommendations', ['user_id'])
    op.create_index('idx_recommendations_resort', 'course_recommendations', ['resort_id'])
    op.create_index('idx_recommendations_status', 'course_recommendations', ['status'])
    op.create_index('idx_recommendations_resort_status', 'course_recommendations', ['resort_id', 'status'])

    # Create user_achievements table
    op.create_table('user_achievements',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('achievement_type', sa.String(length=50), nullable=False),
        sa.Column('achievement_data', sa.JSON(), nullable=True),
        sa.Column('points', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('earned_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['user_profiles.user_id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_achievements_user', 'user_achievements', ['user_id'])
    op.create_index('idx_achievements_type', 'user_achievements', ['achievement_type'])
    op.create_index('idx_achievements_user_type', 'user_achievements', ['user_id', 'achievement_type'])

    # Create achievement_definitions table
    op.create_table('achievement_definitions',
        sa.Column('achievement_type', sa.String(length=50), nullable=False),
        sa.Column('name_zh', sa.String(length=100), nullable=False),
        sa.Column('name_en', sa.String(length=100), nullable=False),
        sa.Column('description_zh', sa.Text(), nullable=True),
        sa.Column('description_en', sa.Text(), nullable=True),
        sa.Column('icon', sa.String(length=20), nullable=False),
        sa.Column('category', sa.String(length=30), nullable=False),
        sa.Column('points', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('requirements', sa.JSON(), nullable=False),
        sa.Column('is_hidden', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('display_order', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('achievement_type')
    )


def downgrade() -> None:
    """Downgrade schema - remove course tracking tables."""
    op.drop_table('achievement_definitions')
    op.drop_index('idx_achievements_user_type', table_name='user_achievements')
    op.drop_index('idx_achievements_type', table_name='user_achievements')
    op.drop_index('idx_achievements_user', table_name='user_achievements')
    op.drop_table('user_achievements')
    op.drop_index('idx_recommendations_resort_status', table_name='course_recommendations')
    op.drop_index('idx_recommendations_status', table_name='course_recommendations')
    op.drop_index('idx_recommendations_resort', table_name='course_recommendations')
    op.drop_index('idx_recommendations_user', table_name='course_recommendations')
    op.drop_table('course_recommendations')
    op.drop_index('idx_course_visits_user_resort', table_name='course_visits')
    op.drop_index('idx_course_visits_resort', table_name='course_visits')
    op.drop_index('idx_course_visits_user', table_name='course_visits')
    op.drop_table('course_visits')
