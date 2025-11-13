"""create gear tables

Revision ID: 001_create_gear_tables
Revises:
Create Date: 2025-11-13

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '001_create_gear_tables'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create gear_items table
    op.create_table(
        'gear_items',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('category', sa.String(50)),
        sa.Column('brand', sa.String(50)),
        sa.Column('purchase_date', sa.Date()),
        sa.Column('status', sa.String(20), nullable=False, server_default='active'),
        sa.Column('role', sa.String(20), server_default='personal'),
        sa.Column('sale_price', sa.Numeric(10, 2)),
        sa.Column('sale_currency', sa.String(3), server_default='TWD'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    )
    op.create_index('ix_gear_items_user_id', 'gear_items', ['user_id'])
    op.create_index('ix_gear_items_status', 'gear_items', ['status'])

    # Create gear_inspections table
    op.create_table(
        'gear_inspections',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('gear_item_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('inspector_user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('inspection_date', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('checklist', postgresql.JSONB, nullable=False),
        sa.Column('overall_status', sa.String(20), nullable=False),
        sa.Column('notes', sa.Text()),
        sa.Column('next_inspection_date', sa.Date()),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['gear_item_id'], ['gear_items.id'], ondelete='CASCADE'),
    )
    op.create_index('idx_gear_inspections_item', 'gear_inspections', ['gear_item_id'])
    op.create_index('idx_gear_inspections_date', 'gear_inspections', ['inspection_date'])

    # Create gear_reminders table
    op.create_table(
        'gear_reminders',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('gear_item_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('reminder_type', sa.String(50), nullable=False),
        sa.Column('scheduled_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('sent_at', sa.DateTime(timezone=True)),
        sa.Column('status', sa.String(20), nullable=False, server_default='pending'),
        sa.Column('message', sa.Text()),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['gear_item_id'], ['gear_items.id'], ondelete='CASCADE'),
    )
    op.create_index('idx_gear_reminders_schedule', 'gear_reminders', ['scheduled_at', 'status'])


def downgrade() -> None:
    op.drop_table('gear_reminders')
    op.drop_table('gear_inspections')
    op.drop_table('gear_items')
