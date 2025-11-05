from functools import lru_cache
from pathlib import Path
from typing import Dict

from .data_loader import load_resort_data
from .models import Resort

# Define the path to the data directory relative to this file's location
# Path(__file__).parent -> app/
# .parent -> resort_api/
# .parent -> project root/
DATA_DIRECTORY = Path(__file__).parent.parent.parent / "specs" / "resort-services" / "data"

# The function that actually loads the data
def _load_data() -> Dict[str, Resort]:
    return load_resort_data(DATA_DIRECTORY)

@lru_cache(maxsize=1)
def get_resorts_db() -> Dict[str, Resort]:
    """Returns the in-memory dictionary of resorts, loading it on first call."""
    return _load_data()

# For direct access if needed, but get_resorts_db is preferred
RESORTS_DB: Dict[str, Resort] = get_resorts_db()
