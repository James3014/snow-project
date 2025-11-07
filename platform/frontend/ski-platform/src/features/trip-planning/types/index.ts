/**
 * Trip Planning Types
 * 行程規劃類型定義
 */

export type TripFlexibility = 'fixed' | 'flexible_1_day' | 'flexible_3_days' | 'flexible_week' | 'any_weekend' | 'any_weekday';

export type FlightStatus = 'not_planned' | 'researching' | 'ready_to_book' | 'booked' | 'confirmed' | 'cancelled';

export type AccommodationStatus = 'not_planned' | 'researching' | 'ready_to_book' | 'booked' | 'confirmed' | 'cancelled';

export type TripStatus = 'planning' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';

export type TripVisibility = 'private' | 'friends_only' | 'public' | 'custom';

export type BuddyRole = 'owner' | 'buddy';

export type BuddyStatus = 'pending' | 'accepted' | 'confirmed' | 'declined' | 'cancelled';

export type SeasonStatus = 'active' | 'completed' | 'archived';

// Season 相關類型
export interface Season {
  season_id: string;
  user_id: string;
  title: string;
  description?: string;
  start_date: string;
  end_date: string;
  goal_trips?: number;
  goal_resorts?: number;
  goal_courses?: number;
  status: SeasonStatus;
  created_at: string;
  updated_at: string;
}

export interface SeasonCreate {
  title: string;
  description?: string;
  start_date: string;
  end_date: string;
  goal_trips?: number;
  goal_resorts?: number;
  goal_courses?: number;
}

export interface SeasonUpdate {
  title?: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  goal_trips?: number;
  goal_resorts?: number;
  goal_courses?: number;
  status?: SeasonStatus;
}

export interface SeasonWithStats extends Season {
  trip_count: number;
  completed_trips: number;
  unique_resorts: number;
  total_buddies: number;
}

// Trip 相關類型
export interface Trip {
  trip_id: string;
  season_id: string;
  user_id: string;
  resort_id: string;
  title?: string;
  start_date: string;
  end_date: string;
  flexibility: TripFlexibility;
  flight_status: FlightStatus;
  accommodation_status: AccommodationStatus;
  trip_status: TripStatus;
  visibility: TripVisibility;
  max_buddies: number;
  current_buddies: number;
  notes?: string;
  completed_at?: string;
  course_visit_id?: string;
  created_at: string;
  updated_at: string;
}

export interface TripCreate {
  season_id: string;
  resort_id: string;
  title?: string;
  start_date: string;
  end_date: string;
  flexibility?: TripFlexibility;
  flight_status?: FlightStatus;
  accommodation_status?: AccommodationStatus;
  visibility?: TripVisibility;
  max_buddies?: number;
  notes?: string;
}

export interface TripBatchCreate {
  season_id: string;
  trips: Omit<TripCreate, 'season_id'>[];
}

export interface TripUpdate {
  resort_id?: string;
  title?: string;
  start_date?: string;
  end_date?: string;
  flexibility?: TripFlexibility;
  flight_status?: FlightStatus;
  accommodation_status?: AccommodationStatus;
  trip_status?: TripStatus;
  visibility?: TripVisibility;
  max_buddies?: number;
  notes?: string;
}

// Buddy 相關類型
export interface BuddyInfo {
  buddy_id: string;
  user_id: string;
  user_display_name: string;
  user_avatar_url?: string;
  role: BuddyRole;
  status: BuddyStatus;
  requested_at: string;
  joined_at?: string;
}

export interface BuddyRequest {
  trip_id: string;
  request_message?: string;
}

export interface BuddyResponse {
  status: BuddyStatus;
  response_message?: string;
}

// 分享相關類型
export interface ShareLinkResponse {
  share_token: string;
  share_url: string;
  expires_at?: string;
}

// 探索和匹配類型
export interface TripExploreFilters {
  resort_id?: string;
  start_date?: string;
  end_date?: string;
  flexibility?: TripFlexibility;
  has_buddy_slots?: boolean;
  limit?: number;
  offset?: number;
}

export interface UserInfo {
  user_id: string;
  display_name: string;
  avatar_url?: string;
  experience_level?: string;
}

export interface TripSummary {
  trip_id: string;
  resort_id: string;
  title?: string;
  start_date: string;
  end_date: string;
  flexibility: TripFlexibility;
  trip_status: TripStatus;
  max_buddies: number;
  current_buddies: number;
  owner_info: UserInfo;
}

export interface MatchScore {
  total_score: number;
  time_score: number;
  location_score: number;
  experience_score: number;
  social_score: number;
  bonus_score: number;
  reasons: string[];
}

export interface TripRecommendation {
  trip: TripSummary;
  match_score: MatchScore;
}

// Calendar 相關類型
export interface CalendarTrip {
  trip_id: string;
  resort_id: string;
  title?: string;
  start_date: string;
  end_date: string;
  trip_status: TripStatus;
  current_buddies: number;
  max_buddies: number;
}

export interface YearOverview {
  year: number;
  months: Record<number, number>;
  total_trips: number;
  completed_trips: number;
}

// 統計類型
export interface SeasonStats {
  season_id: string;
  trip_count: number;
  completed_trips: number;
  unique_resorts: number;
  total_buddies: number;
  goal_progress: {
    trips: { goal?: number; actual: number };
    resorts: { goal?: number; actual: number };
    courses: { goal?: number; actual: number };
  };
}
