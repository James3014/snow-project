"""Add schema_url column to behavior_events table.

Revision ID: 6c0a6e77f5a2
Revises: 0348dd685c6c
Create Date: 2025-10-16 00:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "6c0a6e77f5a2"
down_revision: Union[str, Sequence[str], None] = "0348dd685c6c"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add schema_url column."""
    op.add_column(
        "behavior_events",
        sa.Column("schema_url", sa.String(), nullable=True),
    )


def downgrade() -> None:
    """Remove schema_url column."""
    op.drop_column("behavior_events", "schema_url")
