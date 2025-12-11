"""Repository tests configuration with SQLite (JSON columns as TEXT)."""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../../platform/user_core'))

import pytest
from sqlalchemy import create_engine, event, String
from sqlalchemy.orm import sessionmaker
from sqlalchemy.dialects.postgresql import ARRAY, UUID as PGUUID
from sqlalchemy import TypeDecorator
import json

# Patch ARRAY type for SQLite compatibility before importing models
from sqlalchemy.dialects import postgresql

class JSONEncodedList(TypeDecorator):
    """Store list as JSON string for SQLite."""
    impl = String
    cache_ok = True
    
    def process_bind_param(self, value, dialect):
        if value is not None:
            return json.dumps(value)
        return '[]'
    
    def process_result_value(self, value, dialect):
        if value is not None:
            return json.loads(value)
        return []

# Monkey-patch ARRAY for SQLite
original_array = postgresql.ARRAY
postgresql.ARRAY = lambda *args, **kwargs: JSONEncodedList()

# Import Base and models after patching
from models.user_profile import Base
import models.calendar  # noqa: F401

# Restore original ARRAY
postgresql.ARRAY = original_array


@pytest.fixture(scope="function")
def db_session():
    """Create in-memory SQLite database for each test."""
    engine = create_engine("sqlite:///:memory:", echo=False)
    
    # Handle UUID type for SQLite
    @event.listens_for(engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=OFF")  # Disable FK for testing
        cursor.close()
    
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    session = Session()
    yield session
    session.close()
