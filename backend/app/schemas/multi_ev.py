from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from .station import ChargingStation


class MultiEVVehicleState(BaseModel):
    vehicle_id: str
    vehicle_name: str
    soc_percent: float
    battery_capacity_kwh: float
    efficiency_kwh_per_km: float
    current_distance_from_origin_km: float
    uncoordinated_station_id: str
    coordinated_station_id: str
    arrival_soc_percent: float
    estimated_wait_minutes: int
    charging_duration_minutes: int
    status: str # "EN_ROUTE", "CHARGING", "ARRIVED"


class MultiEVSimulationResult(BaseModel):
    session_id: str
    corridor: str
    vehicles: List[MultiEVVehicleState]
    stations: List[ChargingStation]
    before_coordination: Dict[str, Any]
    after_coordination: Dict[str, Any]
    metrics: Dict[str, Any]
    insights: List[str]
