"""
Authentication utilities for snowbuddy-matching service.
Uses the shared authentication module.
"""
import sys
from pathlib import Path

# Add shared module to path (now copied to snowbuddy_matching directory)
project_root = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(project_root))

from shared.auth import get_current_user_id, get_optional_user_id

__all__ = ['get_current_user_id', 'get_optional_user_id']
