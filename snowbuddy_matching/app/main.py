from fastapi import FastAPI, BackgroundTasks, HTTPException, status, Body, Depends
from typing import Dict, Any, List, Literal
import uuid
import redis
import os
import json

from snowbuddy_matching.app.models.matching import MatchSummary, MatchingPreference, CandidateProfile
from snowbuddy_matching.app.core.matching_logic import calculate_total_match_score
from snowbuddy_matching.app.clients import user_core_client, resort_services_client
from snowbuddy_matching.app import requests_api
from snowbuddy_matching.app.auth_utils import get_current_user_id

app = FastAPI(
    title="SkiDIY Snowbuddy Matching Service",
    version="0.1.0",
    description="Provides an intelligent matching engine to find snowbuddies."
)

app.include_router(requests_api.router, tags=["Matching Requests"])

# Connect to Redis
redis_client = redis.from_url(os.getenv("REDIS_URL", "redis://localhost:6379"))

async def run_matching_process(search_id: str, seeker_id: str, seeker_prefs: MatchingPreference):
    """The actual matching logic that runs in the background."""
    # 1. Store initial status in Redis
    redis_client.set(search_id, json.dumps({"status": "processing", "results": []}), ex=3600) # Expires in 1 hour

    # 2. Fetch all external data required for matching
    all_users = await user_core_client.get_users()
    all_resorts = await resort_services_client.get_resorts() # <-- NEW CALL

    candidates = [
        CandidateProfile(**user_data) for user_data in all_users
        if user_data.get('user_id') != seeker_id
    ]

    # 3. Score and rank candidates
    scored_candidates = []
    for candidate in candidates:
        # Pass resort data into the scoring function
        score = calculate_total_match_score(seeker_prefs, candidate, all_resorts)
        if score > 0.2:
            scored_candidates.append(MatchSummary(**candidate.model_dump(), match_score=score))

    # 4. Sort by score (descending)
    scored_candidates.sort(key=lambda x: x.match_score, reverse=True)

    # 5. Store final results in Redis
    final_results = [result.model_dump() for result in scored_candidates]
    redis_client.set(search_id, json.dumps({"status": "completed", "results": final_results}), ex=3600)


@app.post("/matching/searches", status_code=status.HTTP_202_ACCEPTED)
async def start_search(
    seeker_prefs: MatchingPreference,
    background_tasks: BackgroundTasks,
    seeker_id: str = Depends(get_current_user_id)
):
    """
    Initiates a new snowbuddy search.
    This runs the matching process in the background.

    Requires authentication. The search will be performed for the authenticated user.
    """
    search_id = str(uuid.uuid4())
    background_tasks.add_task(run_matching_process, search_id, seeker_id, seeker_prefs)
    return {"search_id": search_id}


@app.get("/matching/searches/{search_id}")
async def get_search_results(
    search_id: str,
    authenticated_user_id: str = Depends(get_current_user_id)
):
    """
    Retrieves the status and results of a snowbuddy search.

    Requires authentication. Currently allows any authenticated user with the search_id
    to view results. In production, should verify the search belongs to the authenticated user.
    """
    result = redis_client.get(search_id)
    if not result:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Search ID not found or expired.")

    return json.loads(result)


@app.get("/health", summary="Health Check")
def health_check() -> Dict[str, str]:
    """Simple endpoint to verify service availability."""
    return {"status": "ok"}
