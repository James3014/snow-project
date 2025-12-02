"""
Trip planning service facade - delegates to specialized services.
"""
from services.season_service import (
    create_season,
    get_user_seasons,
    get_season,
    update_season,
    delete_season,
    get_season_stats,
    SeasonNotFoundError
)

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

from services.buddy_service import (
    request_to_join_trip,
    respond_to_buddy_request,
    cancel_buddy_request,
    get_trip_buddies,
    calculate_match_score,
    BuddyRequestError
)


class TripPlanningError(Exception):
    """Base exception for trip planning errors."""
    pass


__all__ = [
    # Exceptions
    'TripPlanningError',
    'SeasonNotFoundError',
    'TripNotFoundError',
    'BuddyRequestError',
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
    # Buddy operations
    'request_to_join_trip',
    'respond_to_buddy_request',
    'cancel_buddy_request',
    'get_trip_buddies',
    'calculate_match_score',
]
