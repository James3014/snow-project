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

# 移除對已刪除 buddy_service 的引用
# 這些功能現在由獨立的 Snowbuddy Service 提供


class TripPlanningError(Exception):
    """Base exception for trip planning errors."""
    pass


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
    # Buddy operations 現在由獨立的 Snowbuddy Service 提供
]
