from fastapi import APIRouter, HTTPException
from typing import List
from uuid import uuid4
from datetime import datetime
from app.schemas.vehicle import VehicleCreate, VehicleResponse
from app.database.supabase_client import get_db

router = APIRouter(prefix="/vehicles", tags=["Vehicles"])


@router.get("", response_model=List[VehicleResponse])
async def get_vehicles():
    db = get_db()
    return db.get_vehicles()


@router.get("/{vehicle_id}", response_model=VehicleResponse)
async def get_vehicle(vehicle_id: str):
    db = get_db()
    veh = db.get_vehicle(vehicle_id)
    if not veh:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    return veh


@router.post("", response_model=VehicleResponse)
async def create_vehicle(payload: VehicleCreate):
    db = get_db()
    new_veh = payload.dict()
    new_veh["id"] = f"veh-{uuid4().hex[:8]}"
    new_veh["created_at"] = datetime.now().isoformat()
    return db.add_vehicle(new_veh)
