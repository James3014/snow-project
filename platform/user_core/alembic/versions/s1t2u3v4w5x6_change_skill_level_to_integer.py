"""change skill_level to integer

Revision ID: s1t2u3v4w5x6
Revises: q1r2s3t4u5v6_add_gear_operations_tables
Create Date: 2025-12-02 09:26:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 's1t2u3v4w5x6'
down_revision = 'q1r2s3t4u5v6'  # 指向 gear_operations
branch_labels = None
depends_on = None


def upgrade():
    # 修改 skill_level 為 Integer (1-10)
    op.execute("""
        ALTER TABLE user_profiles 
        ALTER COLUMN skill_level TYPE INTEGER USING 
          CASE 
            WHEN skill_level = 'beginner' THEN 3
            WHEN skill_level = 'intermediate' THEN 6
            WHEN skill_level = 'advanced' THEN 9
            ELSE 5
          END
    """)
    
    # 更新預設值
    op.alter_column('user_profiles', 'skill_level',
                    server_default='5',
                    nullable=True)


def downgrade():
    # 回滾為 String
    op.execute("""
        ALTER TABLE user_profiles 
        ALTER COLUMN skill_level TYPE VARCHAR(20) USING 
          CASE 
            WHEN skill_level <= 3 THEN 'beginner'
            WHEN skill_level <= 6 THEN 'intermediate'
            WHEN skill_level >= 7 THEN 'advanced'
            ELSE 'beginner'
          END
    """)
    
    op.alter_column('user_profiles', 'skill_level',
                    server_default='beginner',
                    nullable=True)
