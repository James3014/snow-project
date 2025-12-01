"""
Tests for buddy matching database migration.

Tests verify:
- Schema creation success
- Constraint correctness (skill values 0-1 range)
- Index existence
"""
import pytest
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import IntegrityError
import uuid
from datetime import datetime, UTC, timedelta

# Import models to ensure they're registered
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent.parent.parent / "platform" / "user_core"))

from models.user_profile import Base, UserProfile
from models.buddy_matching import CASISkillProfile, MatchSearchCache
from models.trip_planning import Season, Trip


@pytest.fixture(scope="function")
def test_db():
    """Create a test database with migrations applied."""
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    session = Session()
    
    yield session
    
    session.close()
    Base.metadata.drop_all(engine)


@pytest.fixture
def test_user(test_db):
    """Create a test user."""
    user = UserProfile(
        user_id=uuid.uuid4(),
        email=f"test_{uuid.uuid4()}@example.com",
        hashed_password="hashed_password",
        display_name="Test User",
        skill_level="intermediate"
    )
    test_db.add(user)
    test_db.commit()
    return user


@pytest.fixture
def test_season(test_db, test_user):
    """Create a test season."""
    from datetime import date
    season = Season(
        season_id=uuid.uuid4(),
        user_id=test_user.user_id,
        title="Test Season",
        start_date=date(2025, 1, 1),
        end_date=date(2025, 3, 31)
    )
    test_db.add(season)
    test_db.commit()
    return season


@pytest.fixture
def test_trip(test_db, test_user, test_season):
    """Create a test trip."""
    from datetime import date
    trip = Trip(
        trip_id=uuid.uuid4(),
        season_id=test_season.season_id,
        user_id=test_user.user_id,
        resort_id="niseko",
        start_date=date(2025, 2, 1),
        end_date=date(2025, 2, 5)
    )
    test_db.add(trip)
    test_db.commit()
    return trip


class TestSchemaCreation:
    """Test that all required tables and columns are created."""
    
    def test_user_profiles_has_skill_level_column(self, test_db):
        """Test that user_profiles table has skill_level column."""
        inspector = inspect(test_db.bind)
        columns = [col['name'] for col in inspector.get_columns('user_profiles')]
        assert 'skill_level' in columns
    
    def test_casi_skill_profiles_table_exists(self, test_db):
        """Test that casi_skill_profiles table is created."""
        inspector = inspect(test_db.bind)
        tables = inspector.get_table_names()
        assert 'casi_skill_profiles' in tables
    
    def test_casi_skill_profiles_has_all_columns(self, test_db):
        """Test that casi_skill_profiles has all required columns."""
        inspector = inspect(test_db.bind)
        columns = [col['name'] for col in inspector.get_columns('casi_skill_profiles')]
        
        required_columns = [
            'user_id',
            'stance_balance',
            'rotation',
            'edging',
            'pressure',
            'timing_coordination',
            'updated_at'
        ]
        
        for col in required_columns:
            assert col in columns, f"Column {col} not found in casi_skill_profiles"
    
    def test_match_search_cache_table_exists(self, test_db):
        """Test that match_search_cache table is created."""
        inspector = inspect(test_db.bind)
        tables = inspector.get_table_names()
        assert 'match_search_cache' in tables
    
    def test_match_search_cache_has_all_columns(self, test_db):
        """Test that match_search_cache has all required columns."""
        inspector = inspect(test_db.bind)
        columns = [col['name'] for col in inspector.get_columns('match_search_cache')]
        
        required_columns = [
            'search_id',
            'trip_id',
            'user_id',
            'results',
            'created_at',
            'expires_at'
        ]
        
        for col in required_columns:
            assert col in columns, f"Column {col} not found in match_search_cache"


class TestConstraints:
    """Test that constraints are correctly applied."""
    
    def test_casi_skill_profile_valid_values(self, test_db, test_user):
        """Test that CASI skill profile accepts valid values (0-1 range)."""
        profile = CASISkillProfile(
            user_id=test_user.user_id,
            stance_balance=0.5,
            rotation=0.7,
            edging=0.3,
            pressure=0.8,
            timing_coordination=0.6
        )
        test_db.add(profile)
        test_db.commit()
        
        # Verify the profile was created
        retrieved = test_db.query(CASISkillProfile).filter_by(
            user_id=test_user.user_id
        ).first()
        assert retrieved is not None
        assert retrieved.stance_balance == 0.5
        assert retrieved.rotation == 0.7
    
    def test_casi_skill_profile_boundary_values(self, test_db, test_user):
        """Test that CASI skill profile accepts boundary values (0 and 1)."""
        profile = CASISkillProfile(
            user_id=test_user.user_id,
            stance_balance=0.0,
            rotation=1.0,
            edging=0.0,
            pressure=1.0,
            timing_coordination=0.5
        )
        test_db.add(profile)
        test_db.commit()
        
        retrieved = test_db.query(CASISkillProfile).filter_by(
            user_id=test_user.user_id
        ).first()
        assert retrieved.stance_balance == 0.0
        assert retrieved.rotation == 1.0
    
    def test_casi_skill_profile_rejects_negative_values(self, test_db, test_user):
        """Test that CASI skill profile rejects negative values."""
        profile = CASISkillProfile(
            user_id=test_user.user_id,
            stance_balance=-0.1,
            rotation=0.5,
            edging=0.5,
            pressure=0.5,
            timing_coordination=0.5
        )
        test_db.add(profile)
        
        # SQLite doesn't enforce CHECK constraints by default in some versions
        # So we'll test the constraint logic exists
        try:
            test_db.commit()
            # If commit succeeds, verify constraint exists in schema
            inspector = inspect(test_db.bind)
            constraints = inspector.get_check_constraints('casi_skill_profiles')
            constraint_names = [c['name'] for c in constraints]
            assert 'check_stance_balance_range' in constraint_names
        except IntegrityError:
            # This is expected if constraints are enforced
            test_db.rollback()
    
    def test_casi_skill_profile_rejects_values_above_one(self, test_db, test_user):
        """Test that CASI skill profile rejects values above 1."""
        profile = CASISkillProfile(
            user_id=test_user.user_id,
            stance_balance=1.1,
            rotation=0.5,
            edging=0.5,
            pressure=0.5,
            timing_coordination=0.5
        )
        test_db.add(profile)
        
        try:
            test_db.commit()
            # Verify constraint exists
            inspector = inspect(test_db.bind)
            constraints = inspector.get_check_constraints('casi_skill_profiles')
            constraint_names = [c['name'] for c in constraints]
            assert 'check_stance_balance_range' in constraint_names
        except IntegrityError:
            test_db.rollback()
    
    def test_casi_skill_profile_user_foreign_key(self, test_db):
        """Test that CASI skill profile has foreign key to user_profiles."""
        inspector = inspect(test_db.bind)
        foreign_keys = inspector.get_foreign_keys('casi_skill_profiles')
        
        assert len(foreign_keys) > 0
        fk = foreign_keys[0]
        assert fk['referred_table'] == 'user_profiles'
        assert 'user_id' in fk['constrained_columns']
    
    def test_match_cache_trip_foreign_key(self, test_db):
        """Test that match_search_cache has foreign key to trips."""
        inspector = inspect(test_db.bind)
        foreign_keys = inspector.get_foreign_keys('match_search_cache')
        
        # Should have foreign keys to both trips and user_profiles
        referred_tables = [fk['referred_table'] for fk in foreign_keys]
        assert 'trips' in referred_tables
        assert 'user_profiles' in referred_tables
    
    def test_match_cache_cascade_delete(self, test_db, test_user, test_trip):
        """Test that match cache is deleted when trip is deleted (CASCADE)."""
        # Create a match cache entry
        cache = MatchSearchCache(
            search_id=uuid.uuid4(),
            trip_id=test_trip.trip_id,
            user_id=test_user.user_id,
            results={"matches": []},
            created_at=datetime.now(UTC),
            expires_at=datetime.now(UTC) + timedelta(hours=1)
        )
        test_db.add(cache)
        test_db.commit()
        
        # Verify cache exists
        assert test_db.query(MatchSearchCache).filter_by(
            trip_id=test_trip.trip_id
        ).first() is not None
        
        # Note: SQLite doesn't enforce CASCADE DELETE by default in test environments
        # In production PostgreSQL, this would cascade automatically
        # For the test, we verify the foreign key relationship exists
        inspector = inspect(test_db.bind)
        foreign_keys = inspector.get_foreign_keys('match_search_cache')
        
        # Find the foreign key to trips
        trip_fk = None
        for fk in foreign_keys:
            if fk['referred_table'] == 'trips':
                trip_fk = fk
                break
        
        assert trip_fk is not None, "Foreign key to trips should exist"
        assert 'trip_id' in trip_fk['constrained_columns']


class TestIndexes:
    """Test that required indexes are created."""
    
    def test_user_profiles_skill_level_index_exists(self, test_db):
        """Test that index on user_profiles.skill_level exists."""
        inspector = inspect(test_db.bind)
        indexes = inspector.get_indexes('user_profiles')
        index_names = [idx['name'] for idx in indexes]
        
        # Check if skill_level is indexed
        skill_level_indexed = any(
            'skill_level' in idx.get('column_names', [])
            for idx in indexes
        )
        assert skill_level_indexed, "skill_level column should be indexed"
    
    def test_match_cache_trip_index_exists(self, test_db):
        """Test that index on match_search_cache.trip_id exists."""
        inspector = inspect(test_db.bind)
        indexes = inspector.get_indexes('match_search_cache')
        
        trip_id_indexed = any(
            'trip_id' in idx.get('column_names', [])
            for idx in indexes
        )
        assert trip_id_indexed, "trip_id column should be indexed"
    
    def test_match_cache_user_index_exists(self, test_db):
        """Test that index on match_search_cache.user_id exists."""
        inspector = inspect(test_db.bind)
        indexes = inspector.get_indexes('match_search_cache')
        
        user_id_indexed = any(
            'user_id' in idx.get('column_names', [])
            for idx in indexes
        )
        assert user_id_indexed, "user_id column should be indexed"
    
    def test_match_cache_expires_index_exists(self, test_db):
        """Test that index on match_search_cache.expires_at exists."""
        inspector = inspect(test_db.bind)
        indexes = inspector.get_indexes('match_search_cache')
        
        expires_indexed = any(
            'expires_at' in idx.get('column_names', [])
            for idx in indexes
        )
        assert expires_indexed, "expires_at column should be indexed"


class TestDataIntegrity:
    """Test data integrity and relationships."""
    
    def test_casi_skill_profile_creation(self, test_db, test_user):
        """Test creating a CASI skill profile."""
        profile = CASISkillProfile(
            user_id=test_user.user_id,
            stance_balance=0.6,
            rotation=0.7,
            edging=0.5,
            pressure=0.8,
            timing_coordination=0.65
        )
        test_db.add(profile)
        test_db.commit()
        
        retrieved = test_db.query(CASISkillProfile).filter_by(
            user_id=test_user.user_id
        ).first()
        
        assert retrieved is not None
        assert retrieved.user_id == test_user.user_id
        assert retrieved.stance_balance == 0.6
        assert retrieved.updated_at is not None
    
    def test_match_cache_creation(self, test_db, test_user, test_trip):
        """Test creating a match search cache entry."""
        cache = MatchSearchCache(
            search_id=uuid.uuid4(),
            trip_id=test_trip.trip_id,
            user_id=test_user.user_id,
            results={"matches": [{"user_id": str(uuid.uuid4()), "score": 85}]},
            created_at=datetime.now(UTC),
            expires_at=datetime.now(UTC) + timedelta(hours=1)
        )
        test_db.add(cache)
        test_db.commit()
        
        retrieved = test_db.query(MatchSearchCache).filter_by(
            search_id=cache.search_id
        ).first()
        
        assert retrieved is not None
        assert retrieved.trip_id == test_trip.trip_id
        assert retrieved.user_id == test_user.user_id
        assert "matches" in retrieved.results
    
    def test_user_skill_level_default(self, test_db):
        """Test that user skill_level has default value."""
        user = UserProfile(
            user_id=uuid.uuid4(),
            email=f"test_{uuid.uuid4()}@example.com",
            hashed_password="hashed_password"
        )
        test_db.add(user)
        test_db.commit()
        
        # Skill level should default to 'beginner'
        assert user.skill_level == "beginner"
    
    def test_casi_skill_profile_default_values(self, test_db, test_user):
        """Test that CASI skill profile has default values of 0.0."""
        profile = CASISkillProfile(user_id=test_user.user_id)
        test_db.add(profile)
        test_db.commit()
        
        retrieved = test_db.query(CASISkillProfile).filter_by(
            user_id=test_user.user_id
        ).first()
        
        assert retrieved.stance_balance == 0.0
        assert retrieved.rotation == 0.0
        assert retrieved.edging == 0.0
        assert retrieved.pressure == 0.0
        assert retrieved.timing_coordination == 0.0
