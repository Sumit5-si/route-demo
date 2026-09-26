from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
from uuid import uuid4
from datetime import datetime
from app.schemas.routing import TripPlanRequest, TripPlanResponse, RouteAlternative, LatLng
from app.schemas.trip import Trip
from app.database.supabase_client import get_db
from app.database.seed_data import CORRIDORS
from app.engine.battery_model import BatteryModel
from app.engine.decision_engine import DecisionEngine
from app.engine.routing_service import RoutingService

router = APIRouter(prefix="/trips", tags=["Trips"])


@router.post("/plan", response_model=TripPlanResponse)
async def plan_trip(payload: TripPlanRequest):
    corridor_key = payload.corridor_key or "INDORE_UJJAIN"
    if corridor_key not in CORRIDORS:
        # Match by name if string provided
        if "ujjain" in payload.destination.lower():
            corridor_key = "INDORE_UJJAIN"
        elif "maheshwar" in payload.destination.lower():
            corridor_key = "INDORE_MAHESHWAR"
        elif "jaipur" in payload.destination.lower():
            corridor_key = "GWALIOR_JAIPUR"
        else:
            corridor_key = "INDORE_UJJAIN"

    corridor = CORRIDORS[corridor_key]
    db = get_db()
    
    # Calculate estimated range
    est_range_km = BatteryModel.calculate_estimated_range_km(
        capacity_kwh=payload.battery_capacity_kwh or 40.5,
        current_soc_percent=payload.current_soc_percent,
        health_percent=payload.battery_health_percent or 95.0,
        efficiency_kwh_per_km=payload.efficiency_kwh_per_km or 0.145,
        temp_celsius=payload.temperature_celsius or 32.0
    )

    # Evaluate options for all 4 modes
    modes = [
        ("BALANCED", "Balanced", "Recommended"),
        ("FASTEST", "Fastest", "High Throughput"),
        ("CHEAPEST", "Cheapest", "Lowest Cost"),
        ("SAFEST", "Safest", "Maximum Buffer")
    ]

    alternatives: List[RouteAlternative] = []
    
    for mode_key, mode_title, badge in modes:
        candidates = await DecisionEngine.evaluate_candidates(
            origin=corridor["origin"]["name"],
            dest=corridor["destination"]["name"],
            corridor_key=corridor_key,
            current_soc=payload.current_soc_percent,
            capacity_kwh=payload.battery_capacity_kwh or 40.5,
            health_percent=payload.battery_health_percent or 95.0,
            efficiency_kwh_per_km=payload.efficiency_kwh_per_km or 0.145,
            temp_celsius=payload.temperature_celsius or 32.0,
            preference_mode=mode_key
        )

        if not candidates:
            dist_km = corridor["distance_km"]
            dur_mins = corridor["base_duration_minutes"]
            arr_soc = BatteryModel.estimate_arrival_soc(
                current_soc_percent=payload.current_soc_percent,
                distance_km=dist_km,
                capacity_kwh=payload.battery_capacity_kwh or 40.5,
                health_percent=payload.battery_health_percent or 95.0,
                efficiency_kwh_per_km=payload.efficiency_kwh_per_km or 0.145,
                temp_celsius=payload.temperature_celsius or 32.0
            )
            dummy_station = {
                "id": "direct-drive-hub",
                "name": "Direct Highway Route (No Charging Required)",
                "latitude": corridor["waypoints"][len(corridor["waypoints"]) // 2]["lat"],
                "longitude": corridor["waypoints"][len(corridor["waypoints"]) // 2]["lng"],
                "address": "Expressway Corridor",
                "corridor": corridor_key,
                "connector_type": "CCS2",
                "charging_power_kw": 0,
                "total_connectors": 0,
                "available_connectors": 0,
                "status": "AVAILABLE",
                "queue_length": 0,
                "estimated_wait_minutes": 0,
                "price_per_kwh": 0.0,
                "amenities": ["Highway Rest Area"]
            }
            route_alt = RouteAlternative(
                id=mode_key,
                name=mode_title,
                badge="Direct Drive",
                total_duration_minutes=dur_mins,
                total_distance_km=dist_km,
                stops_count=0,
                charging_duration_minutes=0,
                estimated_arrival_soc=round(arr_soc, 1),
                estimated_cost_inr=0.0,
                score=100.0,
                recommended_station=dummy_station,
                why_recommended=["Direct non-stop travel along highway corridor."],
                polyline=[LatLng(lat=wp["lat"], lng=wp["lng"]) for wp in corridor["waypoints"]],
                waypoints=corridor["waypoints"]
            )
            alternatives.append(route_alt)
            continue

        best = candidates[0]
        rec_station = best["station"]
        
        route_alt = RouteAlternative(
            id=mode_key,
            name=mode_title,
            badge=badge,
            total_duration_minutes=best["total_dur_mins"],
            total_distance_km=best["total_dist_km"],
            stops_count=1,
            charging_duration_minutes=best["charge_mins"],
            estimated_arrival_soc=best["arrival_soc"],
            estimated_cost_inr=best["cost_inr"],
            score=best["score"],
            recommended_station=rec_station,
            why_recommended=best["why_recommended"],
            polyline=[LatLng(lat=wp["lat"], lng=wp["lng"]) for wp in corridor["waypoints"]],
            waypoints=corridor["waypoints"]
        )
        alternatives.append(route_alt)

    if not alternatives:
        raise HTTPException(status_code=400, detail="No feasible charging route found for current battery state.")

    # Pick recommended based on user preference or BALANCED default
    selected_mode = payload.preference_mode or "BALANCED"
    recommended_route = next((a for a in alternatives if a.id == selected_mode), alternatives[0])

    trip_id = f"trip-{uuid4().hex[:8]}"
    
    # Save active planned trip
    trip_record = {
        "id": trip_id,
        "user_id": "demo-user-1",
        "vehicle_id": payload.vehicle_id or "demo-veh-1",
        "origin": corridor["origin"]["name"],
        "destination": corridor["destination"]["name"],
        "corridor_key": corridor_key,
        "initial_soc": payload.current_soc_percent,
        "current_soc": payload.current_soc_percent,
        "status": "PLANNED",
        "current_step_index": 0,
        "current_position": LatLng(lat=corridor["origin"]["lat"], lng=corridor["origin"]["lng"]),
        "planned_route": recommended_route.dict(),
        "events": [],
        "created_at": datetime.now().isoformat()
    }
    db.save_trip(trip_record)

    nearby = db.get_stations(corridor=corridor_key)

    return TripPlanResponse(
        trip_id=trip_id,
        origin=corridor["origin"]["name"],
        destination=corridor["destination"]["name"],
        corridor_key=corridor_key,
        current_soc=payload.current_soc_percent,
        estimated_range_km=est_range_km,
        temperature_celsius=payload.temperature_celsius or 32.0,
        recommended_route=recommended_route,
        alternatives=alternatives,
        nearby_stations=nearby
    )


@router.get("/{trip_id}")
async def get_trip(trip_id: str):
    db = get_db()
    trip = db.get_trip(trip_id)
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    return trip


@router.post("/{trip_id}/start")
async def start_trip(trip_id: str):
    db = get_db()
    trip = db.get_trip(trip_id)
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    trip["status"] = "ACTIVE"
    return {"message": "Trip started successfully", "status": "ACTIVE"}
