from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class VehicleCreate(BaseModel):
    user_id: Optional[str] = "demo-user-1"
    manufacturer: str = Field(..., example="Tata Motors")
    model: str = Field(..., example="Nexon EV Max")
    purchase_date: Optional[str] = Field("2023-05-15", example="2023-05-15")
    battery_capacity_kwh: float = Field(..., example=40.5)
    battery_health_percent: Optional[float] = Field(95.0, example=95.0)
    connector_type: str = Field("CCS2", example="CCS2")
    max_charging_power_kw: float = Field(50.0, example=50.0)
    average_efficiency_kwh_per_km: float = Field(0.145, example=0.145)  # approx 6.9 km/kWh or 0.145 kWh/km
    current_soc_percent: float = Field(72.0, example=72.0)


class VehicleResponse(VehicleCreate):
    id: str
    created_at: Optional[str] = None
