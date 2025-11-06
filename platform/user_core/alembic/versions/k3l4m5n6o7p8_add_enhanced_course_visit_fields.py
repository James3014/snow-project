"""add enhanced course visit fields

Revision ID: k3l4m5n6o7p8
Revises: e7f8g9h0i1j2
Create Date: 2025-11-06 13:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'k3l4m5n6o7p8'
down_revision = 'e7f8g9h0i1j2'
branch_labels = None
depends_on = None


def upgrade():
    """Add enhanced recording experience fields to course_visits table."""
    # Add new columns for enhanced course visit recording
    op.add_column('course_visits', sa.Column('snow_condition', sa.String(length=50), nullable=True))
    op.add_column('course_visits', sa.Column('weather', sa.String(length=50), nullable=True))
    op.add_column('course_visits', sa.Column('difficulty_feeling', sa.String(length=50), nullable=True))
    op.add_column('course_visits', sa.Column('rating', sa.Integer(), nullable=True))
    op.add_column('course_visits', sa.Column('mood_tags', postgresql.JSON(astext_type=sa.Text()), nullable=True))


def downgrade():
    """Remove enhanced recording experience fields from course_visits table."""
    op.drop_column('course_visits', 'mood_tags')
    op.drop_column('course_visits', 'rating')
    op.drop_column('course_visits', 'difficulty_feeling')
    op.drop_column('course_visits', 'weather')
    op.drop_column('course_visits', 'snow_condition')
