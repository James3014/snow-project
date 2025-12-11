"""
Trip planning service facade - provides unified interface for trip and season operations.
Follows single responsibility principle by delegating to specialized services.
"""

# Season operations
from services.season_service import (
    create_season,
    get_user_seasons,
    get_season,
    update_season,
    delete_season,
    get_season_stats,
    SeasonNotFoundError
)

# Trip operations  
from services.trip_service import (
    create_trip,
    create_trips_batch,
    get_user_trips,
    get_public_trips,
    get_public_trips_with_owner_info,
    get_trip,
    update_trip,
    delete_trip,
    complete_trip,
    generate_share_link,
    get_trip_by_share_token,
    TripNotFoundError,
    UnauthorizedError
)


class TripPlanningError(Exception):
    """Base exception for trip planning operations."""
    pass


# Public API - only expose what's needed
__all__ = [
    # Exceptions
    'TripPlanningError',
    'SeasonNotFoundError', 
    'TripNotFoundError',
    'UnauthorizedError',
    
    # Season operations
    'create_season',
    'get_user_seasons',
    'get_season',
    'update_season',
    'delete_season',
    'get_season_stats',
    
    # Trip operations
    'create_trip',
    'create_trips_batch',
    'get_user_trips',
    'get_public_trips',
    'get_public_trips_with_owner_info',
    'get_trip',
    'update_trip',
    'delete_trip',
    'complete_trip',
    'generate_share_link',
    'get_trip_by_share_token',
]
