"""Add gear operations tables (gear_items, gear_inspections, gear_reminders)

Revision ID: q1r2s3t4u5v6
Revises: p9q0r1s2t3u4
Create Date: 2025-11-14 10:00:00.000000

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
    """Upgrade schema - add gear operations tables."""

    # 1. Create gear_items table
    op.create_table('gear_items',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('category', sa.String(length=50), nullable=True),
        sa.Column('brand', sa.String(length=50), nullable=True),
        sa.Column('purchase_date', sa.Date(), nullable=True),
        sa.Column('status', sa.String(length=20), nullable=False, server_default='active'),
        sa.Column('role', sa.String(length=20), nullable=True, server_default='personal'),
        sa.Column('sale_price', sa.Numeric(precision=10, scale=2), nullable=True),
        sa.Column('sale_currency', sa.String(length=3), nullable=True, server_default='TWD'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['user_profiles.user_id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_gear_items_user_id', 'gear_items', ['user_id'])
    op.create_index('ix_gear_items_status', 'gear_items', ['status'])

    # 2. Create gear_inspections table
    op.create_table('gear_inspections',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('gear_item_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('inspector_user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('inspection_date', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('checklist', postgresql.JSONB, nullable=False),
        sa.Column('overall_status', sa.String(length=20), nullable=False),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('next_inspection_date', sa.Date(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['gear_item_id'], ['gear_items.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['inspector_user_id'], ['user_profiles.user_id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_gear_inspections_item', 'gear_inspections', ['gear_item_id'])
    op.create_index('idx_gear_inspections_date', 'gear_inspections', ['inspection_date'])

    # 3. Create gear_reminders table
    op.create_table('gear_reminders',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('gear_item_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('reminder_type', sa.String(length=50), nullable=False),
        sa.Column('scheduled_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('sent_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('status', sa.String(length=20), nullable=False, server_default='pending'),
        sa.Column('message', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['gear_item_id'], ['gear_items.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_gear_reminders_schedule', 'gear_reminders', ['scheduled_at', 'status'])


def downgrade() -> None:
    """Downgrade schema - remove gear operations tables."""

    op.drop_index('idx_gear_reminders_schedule', table_name='gear_reminders')
    op.drop_table('gear_reminders')

    op.drop_index('idx_gear_inspections_date', table_name='gear_inspections')
    op.drop_index('idx_gear_inspections_item', table_name='gear_inspections')
    op.drop_table('gear_inspections')

    op.drop_index('ix_gear_items_status', table_name='gear_items')
    op.drop_index('ix_gear_items_user_id', table_name='gear_items')
    op.drop_table('gear_items')
