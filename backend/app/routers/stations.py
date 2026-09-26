from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from app.schemas.station import ChargingStation, StationLiveStatusUpdate
from app.database.supabase_client import get_db

router = APIRouter(prefix="/stations", tags=["Stations"])


@router.get("", response_model=List[ChargingStation])
async def get_stations(
    corridor: Optional[str] = Query(None, description="Corridor filter: INDORE_UJJAIN, INDORE_MAHESHWAR, GWALIOR_JAIPUR"),
    status: Optional[str] = Query(None, description="AVAILABLE, BUSY, OFFLINE"),
    connector: Optional[str] = Query(None, description="CCS2, Type2"),
    min_power_kw: Optional[float] = Query(None, description="Minimum charging power in kW")
):
    db = get_db()
    stations = db.get_stations(corridor=corridor)
    
    filtered = []
    for s in stations:
        if status and s.get("status") != status:
            continue
        if connector and s.get("connector_type") != connector:
            continue
        if min_power_kw and s.get("charging_power_kw", 0) < min_power_kw:
            continue
        filtered.append(s)
        
    return filtered


@router.get("/{station_id}", response_model=ChargingStation)
async def get_station(station_id: str):
    db = get_db()
    st = db.get_station(station_id)
    if not st:
        raise HTTPException(status_code=404, detail="Station not found")
    return st


@router.patch("/{station_id}/live-status", response_model=ChargingStation)
async def update_station_status(station_id: str, updates: StationLiveStatusUpdate):
    db = get_db()
    update_dict = {k: v for k, v in updates.dict().items() if v is not None}
    st = db.update_station(station_id, update_dict)
    if not st:
        raise HTTPException(status_code=404, detail="Station not found")
    return st
