"""
Simple test for Trip Calendar Integration
"""
import asyncio
from app.services.trip_integration import TripIntegrationService
from app.models.trip_participant import TripParticipant


async def test_trip_integration():
    """Test trip integration service"""
    service = TripIntegrationService()
    
    # Mock trip data
    trip_id = "test_trip_123"
    user_id = "test_user_456"
    
    print("Testing Trip Integration Service...")
    
    # Test 1: Get trip info (will fail without real API)
    print("1. Testing get_trip_info...")
    trip_info = await service.get_trip_info(trip_id)
    print(f"Trip info: {trip_info}")
    
    # Test 2: Get trip calendar event (will fail without real API)
    print("2. Testing get_trip_calendar_event...")
    calendar_event = await service.get_trip_calendar_event(trip_id)
    print(f"Calendar event: {calendar_event}")
    
    # Test 3: Create participant model
    print("3. Testing TripParticipant model...")
    participant = TripParticipant(
        trip_id=trip_id,
        user_id=user_id,
        status="confirmed"
    )
    print(f"Participant: {participant}")
    print(f"Participant JSON: {participant.model_dump()}")
    
    print("✅ Basic tests completed!")


if __name__ == "__main__":
    asyncio.run(test_trip_integration())
