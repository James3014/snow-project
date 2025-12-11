/**
 * Snowbuddy Matching API Client
 * 智慧媒合 API 客戶端
 */

const SNOWBUDDY_API_URL = import.meta.env.VITE_SNOWBUDDY_API_URL || 'http://localhost:8002';

export interface MatchingPreference {
  preferred_resorts: string[];
  date_range: {
    start: string;
    end: string;
  };
  skill_level_range: [number, number];
  preferred_role?: 'buddy' | 'student' | 'coach';
}

export interface MatchResult {
  user_id: string;
  score: number;
  breakdown: {
    skill_score: number;
    location_score: number;
    time_score: number;
    role_score: number;
    knowledge_score: number;
  };
}

// Trip 申請相關介面
export interface TripApplication {
  request_id: string;
  trip_id: string;
  status: 'pending' | 'accepted' | 'declined';
}

export interface TripParticipant {
  trip_id: string;
  user_id: string;
  joined_at: string;
  status: string;
  calendar_synced: boolean;
}

export interface SearchResult {
  status: 'pending' | 'completed' | 'failed';
  matches: MatchResult[];
}

export interface MatchRequest {
  request_id: string;
  requester_id: string;
  target_user_id: string;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
}

/**
 * 發起智慧媒合搜尋
 */
export async function startSearch(preferences: MatchingPreference): Promise<{ search_id: string }> {
  const token = localStorage.getItem('token');
  
  const response = await fetch(`${SNOWBUDDY_API_URL}/matching/searches`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(preferences),
  });

  if (!response.ok) {
    throw new Error(`Failed to start search: ${response.statusText}`);
  }

  return response.json();
}

/**
 * 查詢媒合結果
 */
export async function getSearchResults(searchId: string): Promise<SearchResult> {
  const token = localStorage.getItem('token');
  
  const response = await fetch(`${SNOWBUDDY_API_URL}/matching/searches/${searchId}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to get search results: ${response.statusText}`);
  }

  return response.json();
}

/**
 * 發送媒合請求
 */
export async function sendMatchRequest(targetUserId: string): Promise<{ status: string; request_id: string }> {
  const token = localStorage.getItem('token');
  
  const response = await fetch(`${SNOWBUDDY_API_URL}/requests`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ target_user_id: targetUserId }),
  });

  if (!response.ok) {
    throw new Error(`Failed to send match request: ${response.statusText}`);
  }

  return response.json();
}

/**
 * 回應媒合請求
 */
export async function respondToRequest(
  requestId: string,
  action: 'accept' | 'decline'
): Promise<{ status: string }> {
  const token = localStorage.getItem('token');
  
  const response = await fetch(`${SNOWBUDDY_API_URL}/requests/${requestId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ action }),
  });

  if (!response.ok) {
    throw new Error(`Failed to respond to request: ${response.statusText}`);
  }

  return response.json();
}

// Trip 申請相關 API
export async function applyToTrip(tripId: string, token: string): Promise<TripApplication> {
  const response = await fetch(`${SNOWBUDDY_API_URL}/trips/${tripId}/apply`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to apply to trip: ${response.statusText}`);
  }

  return response.json();
}

export async function respondToTripApplication(
  tripId: string, 
  requestId: string, 
  action: 'accept' | 'decline',
  token: string
): Promise<{ status: string; participant?: TripParticipant }> {
  const response = await fetch(`${SNOWBUDDY_API_URL}/trips/${tripId}/applications/${requestId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ action }),
  });

  if (!response.ok) {
    throw new Error(`Failed to respond to application: ${response.statusText}`);
  }

  return response.json();
}

export async function leaveTrip(tripId: string, userId: string, token: string): Promise<{ status: string }> {
  const response = await fetch(`${SNOWBUDDY_API_URL}/trips/${tripId}/participants/${userId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to leave trip: ${response.statusText}`);
  }

  return response.json();
}

export const snowbuddyApi = {
  startSearch,
  getSearchResults,
  sendMatchRequest,
  respondToRequest,
  // Trip 相關 API
  applyToTrip,
  respondToTripApplication,
  leaveTrip,
};
