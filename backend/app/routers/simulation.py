from fastapi import APIRouter, HTTPException
from app.schemas.simulation import TriggerSimulationEventRequest, SimulationEventResponse
from app.simulation.event_simulator import EventSimulator

router = APIRouter(prefix="/simulation", tags=["Simulation"])


@router.post("/events", response_model=SimulationEventResponse)
async def trigger_simulation_event(payload: TriggerSimulationEventRequest):
    result = await EventSimulator.trigger_event(
        event_type=payload.event_type,
        trip_id=payload.trip_id,
        station_id=payload.station_id,
        target_wait_minutes=payload.target_wait_minutes or 42,
        traffic_delay_minutes=payload.traffic_delay_minutes or 25,
        soc_drop_percent=payload.soc_drop_percent or 15.0
    )
    return result
