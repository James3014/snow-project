"""Add social features tables

Revision ID: m1n2o3p4q5r6
Revises: l5m6n7o8p9q0
Create Date: 2025-11-07 12:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = 'm1n2o3p4q5r6'
down_revision: Union[str, Sequence[str], None] = 'l5m6n7o8p9q0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema - add social features tables."""

    # 1. Create user_follows table
    op.create_table('user_follows',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('follower_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('following_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.CheckConstraint('follower_id != following_id', name='check_no_self_follow'),
        sa.ForeignKeyConstraint(['follower_id'], ['user_profiles.user_id'], ),
        sa.ForeignKeyConstraint(['following_id'], ['user_profiles.user_id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('follower_id', 'following_id', name='uq_follower_following')
    )
    op.create_index('idx_follows_follower', 'user_follows', ['follower_id'])
    op.create_index('idx_follows_following', 'user_follows', ['following_id'])
    op.create_index('idx_follows_created', 'user_follows', ['created_at'])

    # 2. Create activity_feed_items table
    op.create_table('activity_feed_items',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('activity_type', sa.String(length=50), nullable=False),
        sa.Column('entity_type', sa.String(length=50), nullable=True),
        sa.Column('entity_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('content_json', sa.JSON(), nullable=False),
        sa.Column('visibility', sa.String(length=20), nullable=False, server_default='public'),
        sa.Column('likes_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('comments_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['user_profiles.user_id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_feed_user_id', 'activity_feed_items', ['user_id'])
    op.create_index('idx_feed_created_at', 'activity_feed_items', ['created_at'])
    op.create_index('idx_feed_visibility', 'activity_feed_items', ['visibility'])
    op.create_index('idx_feed_type', 'activity_feed_items', ['activity_type'])
    op.create_index('idx_feed_user_created', 'activity_feed_items', ['user_id', 'created_at'])
    op.create_index('idx_feed_visibility_created', 'activity_feed_items', ['visibility', 'created_at'])

    # 3. Create activity_likes table
    op.create_table('activity_likes',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('activity_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['activity_id'], ['activity_feed_items.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['user_profiles.user_id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('activity_id', 'user_id', name='uq_activity_user_like')
    )
    op.create_index('idx_likes_activity', 'activity_likes', ['activity_id'])
    op.create_index('idx_likes_user', 'activity_likes', ['user_id'])
    op.create_index('idx_likes_created', 'activity_likes', ['created_at'])

    # 4. Create activity_comments table
    op.create_table('activity_comments',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('activity_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('parent_comment_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['activity_id'], ['activity_feed_items.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['parent_comment_id'], ['activity_comments.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['user_profiles.user_id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_comments_activity', 'activity_comments', ['activity_id', 'created_at'])
    op.create_index('idx_comments_user', 'activity_comments', ['user_id'])
    op.create_index('idx_comments_parent', 'activity_comments', ['parent_comment_id'])


def downgrade() -> None:
    """Downgrade schema - remove social features tables."""

    op.drop_index('idx_comments_parent', table_name='activity_comments')
    op.drop_index('idx_comments_user', table_name='activity_comments')
    op.drop_index('idx_comments_activity', table_name='activity_comments')
    op.drop_table('activity_comments')

    op.drop_index('idx_likes_created', table_name='activity_likes')
    op.drop_index('idx_likes_user', table_name='activity_likes')
    op.drop_index('idx_likes_activity', table_name='activity_likes')
    op.drop_table('activity_likes')

    op.drop_index('idx_feed_visibility_created', table_name='activity_feed_items')
    op.drop_index('idx_feed_user_created', table_name='activity_feed_items')
    op.drop_index('idx_feed_type', table_name='activity_feed_items')
    op.drop_index('idx_feed_visibility', table_name='activity_feed_items')
    op.drop_index('idx_feed_created_at', table_name='activity_feed_items')
    op.drop_index('idx_feed_user_id', table_name='activity_feed_items')
    op.drop_table('activity_feed_items')

    op.drop_index('idx_follows_created', table_name='user_follows')
    op.drop_index('idx_follows_following', table_name='user_follows')
    op.drop_index('idx_follows_follower', table_name='user_follows')
    op.drop_table('user_follows')
