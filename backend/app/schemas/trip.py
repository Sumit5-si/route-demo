from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from .routing import RouteAlternative, LatLng


class TripEvent(BaseModel):
    id: str
    trip_id: str
    event_type: str # STATION_CONGESTION, STATION_OFFLINE, TRAFFIC_SURGE, SOC_DROP
    station_id: Optional[str] = None
    old_value: Optional[str] = None
    new_value: Optional[str] = None
    description: str
    timestamp: str


class Trip(BaseModel):
    id: str
    user_id: str = "demo-user-1"
    vehicle_id: str = "demo-veh-1"
    origin: str
    destination: str
    corridor_key: str
    initial_soc: float
    current_soc: float
    status: str = "PLANNED" # PLANNED, ACTIVE, COMPLETED, CANCELLED
    current_step_index: int = 0
    current_position: Optional[LatLng] = None
    planned_route: RouteAlternative
    events: List[TripEvent] = []
    created_at: str
