"""
Authentication utilities for resort-services.
Uses the shared authentication module.
"""
import sys
from pathlib import Path

# Add shared module to path
project_root = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(project_root))

from shared.auth import get_current_user_id, get_optional_user_id

__all__ = ['get_current_user_id', 'get_optional_user_id']
