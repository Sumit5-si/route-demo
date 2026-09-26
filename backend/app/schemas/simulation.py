from pydantic import BaseModel, Field
from typing import Optional, Literal, List, Dict, Any

EventType = Literal[
    "STATION_CONGESTION",
    "STATION_OFFLINE",
    "TRAFFIC_DELAY",
    "SOC_DROP_RAPID",
    "RESET_NORMAL"
]


class TriggerSimulationEventRequest(BaseModel):
    trip_id: Optional[str] = None
    event_type: EventType = "STATION_CONGESTION"
    station_id: Optional[str] = "indore-st-1"
    target_wait_minutes: Optional[int] = 42
    traffic_delay_minutes: Optional[int] = 25
    soc_drop_percent: Optional[float] = 15.0


class SimulationEventResponse(BaseModel):
    success: bool
    event_type: str
    message: str
    previous_station_id: Optional[str] = None
    new_station_id: Optional[str] = None
    replan_triggered: bool = True
    explanation: List[str] = []
    updated_route: Optional[Dict[str, Any]] = None
