from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from .station import ChargingStation


class LatLng(BaseModel):
    lat: float
    lng: float


class RouteAlternative(BaseModel):
    id: str  # "BALANCED", "FASTEST", "CHEAPEST", "SAFEST"
    name: str  # "Balanced", "Fastest", "Cheapest", "Safest"
    badge: Optional[str] = "Recommended"
    total_duration_minutes: int
    total_distance_km: float
    stops_count: int
    charging_duration_minutes: int
    estimated_arrival_soc: float
    estimated_cost_inr: float
    score: float
    recommended_station: ChargingStation
    why_recommended: List[str]
    polyline: List[LatLng]
    waypoints: List[Dict[str, Any]]


class TripPlanRequest(BaseModel):
    origin: str = Field("Indore, MP", example="Indore, MP")
    destination: str = Field("Ujjain, MP", example="Ujjain, MP")
    corridor_key: Optional[str] = Field("INDORE_UJJAIN", example="INDORE_UJJAIN")
    vehicle_id: Optional[str] = "demo-veh-1"
    current_soc_percent: float = Field(42.0, example=42.0)
    battery_capacity_kwh: Optional[float] = 40.5
    battery_health_percent: Optional[float] = 95.0
    efficiency_kwh_per_km: Optional[float] = 0.145
    temperature_celsius: Optional[float] = 32.0
    preference_mode: Optional[str] = "BALANCED" # BALANCED, FASTEST, CHEAPEST, SAFEST


class TripPlanResponse(BaseModel):
    trip_id: str
    origin: str
    destination: str
    corridor_key: str
    current_soc: float
    estimated_range_km: float
    temperature_celsius: float
    recommended_route: RouteAlternative
    alternatives: List[RouteAlternative]
    nearby_stations: List[ChargingStation]
