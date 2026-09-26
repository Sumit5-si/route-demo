from fastapi import APIRouter, Query
from app.schemas.multi_ev import MultiEVSimulationResult
from app.engine.multi_ev_engine import MultiEVEngine

router = APIRouter(prefix="/multi-ev", tags=["Multi-EV Coordination"])


@router.get("/simulate", response_model=MultiEVSimulationResult)
async def simulate_multi_ev(
    corridor: str = Query("INDORE_UJJAIN", description="Corridor key: INDORE_UJJAIN, INDORE_MAHESHWAR, GWALIOR_JAIPUR")
):
    return MultiEVEngine.simulate_fleet(corridor_key=corridor)
