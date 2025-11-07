"""Add display_name to user_profiles

Revision ID: l5m6n7o8p9q0
Revises: k3l4m5n6o7p8
Create Date: 2025-11-07 11:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = 'l5m6n7o8p9q0'
down_revision: Union[str, Sequence[str], None] = 'k3l4m5n6o7p8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add display_name and avatar_url to user_profiles."""

    # 添加显示名称（用于社交功能）
    op.add_column('user_profiles',
        sa.Column('display_name', sa.String(length=100), nullable=True)
    )

    # 添加头像 URL（可选，未来扩展）
    op.add_column('user_profiles',
        sa.Column('avatar_url', sa.String(length=500), nullable=True)
    )

    # 添加默认动态可见性设置
    op.add_column('user_profiles',
        sa.Column('default_post_visibility', sa.String(length=20),
                  server_default='public', nullable=True)
    )

    # 为现有用户生成默认名称（从 user_id 生成）
    # 注意：这是一个数据迁移，确保现有用户有名称
    op.execute("""
        UPDATE user_profiles
        SET display_name = 'User_' || SUBSTRING(CAST(user_id AS TEXT), 1, 8)
        WHERE display_name IS NULL
    """)


def downgrade() -> None:
    """Remove display_name and avatar_url from user_profiles."""
    op.drop_column('user_profiles', 'default_post_visibility')
    op.drop_column('user_profiles', 'avatar_url')
    op.drop_column('user_profiles', 'display_name')
