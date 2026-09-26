from pydantic import BaseModel, Field
from typing import Optional, Literal
from datetime import datetime

StationStatus = Literal["AVAILABLE", "BUSY", "OFFLINE"]


class ChargingStation(BaseModel):
    id: str
    name: str
    latitude: float
    longitude: float
    address: str
    corridor: Optional[str] = "INDORE_UJJAIN" # INDORE_UJJAIN, INDORE_MAHESHWAR, GWALIOR_JAIPUR
    connector_type: str = "CCS2"
    charging_power_kw: float = 60.0
    total_connectors: int = 4
    available_connectors: int = 3
    status: StationStatus = "AVAILABLE"
    queue_length: int = 1
    estimated_wait_minutes: int = 8
    price_per_kwh: float = 18.0
    last_updated: Optional[str] = None
    amenities: Optional[list[str]] = ["Cafe", "Restrooms", "WiFi", "24/7 Security"]


class StationLiveStatusUpdate(BaseModel):
    station_id: str
    status: Optional[StationStatus] = None
    available_connectors: Optional[int] = None
    queue_length: Optional[int] = None
    estimated_wait_minutes: Optional[int] = None
