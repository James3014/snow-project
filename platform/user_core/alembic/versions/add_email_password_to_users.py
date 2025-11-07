"""Add email and password to user profiles

Revision ID: add_email_password
Revises: m1n2o3p4q5r6
Create Date: 2025-11-07

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_email_password'
down_revision = 'm1n2o3p4q5r6'
branch_labels = None
depends_on = None


def upgrade():
    # Add email column (nullable first for existing rows)
    op.add_column('user_profiles',
        sa.Column('email', sa.String(length=255), nullable=True))

    # Add hashed_password column (nullable first for existing rows)
    op.add_column('user_profiles',
        sa.Column('hashed_password', sa.String(length=255), nullable=True))

    # Set default email for existing users (based on user_id)
    op.execute("""
        UPDATE user_profiles
        SET email = CONCAT(CAST(user_id AS TEXT), '@temporary.local')
        WHERE email IS NULL
    """)

    # Set default password hash for existing users
    # This is a bcrypt hash of 'password123' - CHANGE IN PRODUCTION!
    op.execute("""
        UPDATE user_profiles
        SET hashed_password = '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIVInVket2'
        WHERE hashed_password IS NULL
    """)

    # Now make columns not nullable
    op.alter_column('user_profiles', 'email', nullable=False)
    op.alter_column('user_profiles', 'hashed_password', nullable=False)

    # Create unique index on email
    op.create_index('ix_user_profiles_email', 'user_profiles', ['email'], unique=True)


def downgrade():
    op.drop_index('ix_user_profiles_email', table_name='user_profiles')
    op.drop_column('user_profiles', 'hashed_password')
    op.drop_column('user_profiles', 'email')
