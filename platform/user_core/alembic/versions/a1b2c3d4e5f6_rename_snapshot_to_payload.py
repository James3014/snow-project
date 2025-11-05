"""Rename change_feed.snapshot to payload

Revision ID: a1b2c3d4e5f6
Revises: 6c0a6e77f5a2
Create Date: 2025-10-16 00:10:00.000000
"""
from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = "a1b2c3d4e5f6"
down_revision: Union[str, Sequence[str], None] = "6c0a6e77f5a2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Rename snapshot column to payload."""
    with op.batch_alter_table("change_feed") as batch_op:
        batch_op.alter_column("snapshot", new_column_name="payload")


def downgrade() -> None:
    """Revert payload column back to snapshot."""
    with op.batch_alter_table("change_feed") as batch_op:
        batch_op.alter_column("payload", new_column_name="snapshot")
