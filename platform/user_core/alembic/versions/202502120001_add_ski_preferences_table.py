"""Add ski preferences table"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision = '202502120001'
down_revision = 's1t2u3v4w5x6'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'user_ski_preferences',
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('resort_ids', postgresql.ARRAY(sa.String()), nullable=False, server_default='{}'),
        sa.Column('source', sa.String(length=100), nullable=False, server_default='trip_planner'),
        sa.Column('last_trip_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('last_synced_at', sa.DateTime(timezone=False), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['user_id'], ['user_profiles.user_id'], ),
        sa.PrimaryKeyConstraint('user_id')
    )


def downgrade() -> None:
    op.drop_table('user_ski_preferences')
