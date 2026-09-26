from fastapi import APIRouter
from typing import List, Dict, Any
from app.database.supabase_client import get_db

router = APIRouter(prefix="/history", tags=["History"])


@router.get("", response_model=List[Dict[str, Any]])
async def get_trip_history():
    db = get_db()
    return db.get_history()
