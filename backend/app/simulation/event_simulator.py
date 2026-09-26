"""
Dynamic Event Simulator
Handles live injection of outages, queue surges, traffic jams, and SOC drops,
then triggers real-time explainable re-routing.
"""
from datetime import datetime
from typing import Dict, Any, Optional
from app.database.supabase_client import get_db
from app.database.seed_data import CORRIDORS
from app.engine.decision_engine import DecisionEngine
from app.engine.explainer import ExplainerEngine
from app.engine.routing_service import RoutingService
from app.simulation.ws_manager import ws_manager


class EventSimulator:
    @classmethod
    async def trigger_event(
        cls,
        event_type: str,
        trip_id: Optional[str] = None,
        station_id: Optional[str] = None,
        target_wait_minutes: int = 42,
        traffic_delay_minutes: int = 25,
        soc_drop_percent: float = 15.0
    ) -> Dict[str, Any]:
        db = get_db()
        trip = db.get_trip(trip_id) if trip_id else None
        
        corridor_key = trip.get("corridor_key", "INDORE_UJJAIN") if trip else "INDORE_UJJAIN"
        current_soc = trip.get("current_soc", 42.0) if trip else 42.0
        
        # 1. Update station status according to event
        old_station = None
        if station_id:
            old_station = db.get_station(station_id)
        if not old_station:
            stations = db.get_stations(corridor=corridor_key)
            old_station = stations[0] if stations else None
            station_id = old_station["id"] if old_station else "indore-st-1"

        old_station_name = old_station["name"] if old_station else "Station A"
        old_wait = old_station.get("estimated_wait_minutes", 8) if old_station else 8

        if event_type == "STATION_CONGESTION":
            db.update_station(station_id, {
                "status": "BUSY",
                "estimated_wait_minutes": target_wait_minutes,
                "queue_length": 6,
                "available_connectors": 0,
                "last_updated": "Just now (Live Surge)"
            })
            event_desc = f"{old_station_name} wait time surged from {old_wait}m to {target_wait_minutes}m due to sudden fleet arrival."

        elif event_type == "STATION_OFFLINE":
            db.update_station(station_id, {
                "status": "OFFLINE",
                "estimated_wait_minutes": 999,
                "queue_length": 0,
                "available_connectors": 0,
                "last_updated": "Just now (Grid Maintenance)"
            })
            event_desc = f"{old_station_name} is temporarily OFFLINE due to grid transformer maintenance."

        elif event_type == "SOC_DROP_RAPID":
            current_soc = max(12.0, current_soc - soc_drop_percent)
            if trip:
                trip["current_soc"] = current_soc
            event_desc = f"Vehicle SOC dropped rapidly by {soc_drop_percent}% due to aggressive heating/AC load and terrain climb."

        elif event_type == "TRAFFIC_DELAY":
            event_desc = f"Traffic jam detected (+{traffic_delay_minutes} min delay) approaching {old_station_name}."

        elif event_type == "RESET_NORMAL":
            # Reset all stations to default available
            for st in db.get_stations():
                db.update_station(st["id"], {
                    "status": "AVAILABLE",
                    "estimated_wait_minutes": 5,
                    "queue_length": 1,
                    "available_connectors": 3,
                    "last_updated": "Just now"
                })
            event_desc = "All charging stations reset to normal operating conditions."

        # 2. Re-evaluate options using Decision Engine
        candidates = await DecisionEngine.evaluate_candidates(
            origin="Current Position",
            dest=CORRIDORS[corridor_key]["destination"]["name"],
            corridor_key=corridor_key,
            current_soc=current_soc,
            preference_mode="BALANCED"
        )

        new_recommended = candidates[0] if candidates else None
        new_station = new_recommended["station"] if new_recommended else old_station
        new_station_name = new_station["name"] if new_station else "Alternative Hub"
        
        # 3. Generate Re-plan Explanation
        replan_details = {
            "old_wait": old_wait,
            "new_wait": target_wait_minutes,
            "time_saved": max(15, target_wait_minutes - new_station.get("estimated_wait_minutes", 5)),
            "arrival_soc": new_recommended["arrival_soc"] if new_recommended else 18.0,
            "delay": traffic_delay_minutes
        }
        reasons = ExplainerEngine.explain_replan(
            old_station_name=old_station_name,
            new_station_name=new_station_name,
            reason_type=event_type,
            details=replan_details
        )

        # 4. Generate updated route polyline
        corridor = CORRIDORS[corridor_key]
        new_route_payload = {
            "id": "REPLANNED_DYNAMIC",
            "name": "Dynamic Re-route",
            "badge": "Re-planned",
            "total_duration_minutes": new_recommended["total_dur_mins"] if new_recommended else corridor["base_duration_minutes"],
            "total_distance_km": new_recommended["total_dist_km"] if new_recommended else corridor["distance_km"],
            "stops_count": 1,
            "charging_duration_minutes": new_recommended["charge_mins"] if new_recommended else 20,
            "estimated_arrival_soc": new_recommended["arrival_soc"] if new_recommended else 18.0,
            "estimated_cost_inr": new_recommended["cost_inr"] if new_recommended else 150.0,
            "score": new_recommended["score"] if new_recommended else 50.0,
            "recommended_station": new_station,
            "why_recommended": reasons,
            "polyline": [{"lat": wp["lat"], "lng": wp["lng"]} for wp in corridor["waypoints"]],
            "waypoints": corridor["waypoints"]
        }

        # Save event in trip if exists
        event_record = {
            "id": f"evt-{datetime.now().strftime('%H%M%S')}",
            "trip_id": trip_id or "live-trip",
            "event_type": event_type,
            "station_id": station_id,
            "old_value": str(old_wait),
            "new_value": str(target_wait_minutes if event_type == "STATION_CONGESTION" else "OFFLINE"),
            "description": event_desc,
            "timestamp": datetime.now().isoformat()
        }

        ws_payload = {
            "type": "TRIP_REPLANNED",
            "event": event_record,
            "replan_triggered": True,
            "previous_station_id": station_id,
            "new_station_id": new_station["id"] if new_station else None,
            "explanation": reasons,
            "updated_route": new_route_payload,
            "updated_stations": db.get_stations(corridor=corridor_key)
        }

        # 5. Broadcast across WebSockets
        if trip_id:
            await ws_manager.broadcast_to_trip(trip_id, ws_payload)
        await ws_manager.broadcast_all(ws_payload)

        return {
            "success": True,
            "event_type": event_type,
            "message": event_desc,
            "previous_station_id": station_id,
            "new_station_id": new_station["id"] if new_station else None,
            "replan_triggered": True,
            "explanation": reasons,
            "updated_route": new_route_payload
        }
