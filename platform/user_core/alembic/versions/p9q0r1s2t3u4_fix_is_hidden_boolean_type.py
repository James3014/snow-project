"""Fix is_hidden field type from Integer to Boolean

Revision ID: p9q0r1s2t3u4
Revises: n7o8p9q0r1s2
Create Date: 2025-11-07 14:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


revision: str = 'p9q0r1s2t3u4'
down_revision: Union[str, Sequence[str], None] = 'n7o8p9q0r1s2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Convert is_hidden from Integer to Boolean."""
    # For PostgreSQL, we can alter the column type with USING clause to convert data
    # 0 -> False, any other value -> True
    op.execute("""
        ALTER TABLE achievement_definitions
        ALTER COLUMN is_hidden TYPE BOOLEAN
        USING CASE WHEN is_hidden = 0 THEN FALSE ELSE TRUE END
    """)

    # Update the default value to False
    op.alter_column('achievement_definitions', 'is_hidden',
                    server_default=sa.false())


def downgrade() -> None:
    """Revert is_hidden from Boolean back to Integer."""
    # Convert back: False -> 0, True -> 1
    op.execute("""
        ALTER TABLE achievement_definitions
        ALTER COLUMN is_hidden TYPE INTEGER
        USING CASE WHEN is_hidden = FALSE THEN 0 ELSE 1 END
    """)

    # Restore the original default value
    op.alter_column('achievement_definitions', 'is_hidden',
                    server_default='0')
