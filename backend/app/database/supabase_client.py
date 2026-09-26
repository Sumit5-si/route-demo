import os
import logging
from typing import Optional, List, Dict, Any
from copy import deepcopy
from app.config import settings
from app.database.seed_data import SEED_STATIONS, SEED_VEHICLES, SEED_HISTORY, CORRIDORS

logger = logging.getLogger("evoyage.db")

# In-Memory Database Store (Local / Offline First)
class LocalStore:
    def __init__(self):
        self.stations: Dict[str, Dict[str, Any]] = {s["id"]: deepcopy(s) for s in SEED_STATIONS}
        self.vehicles: Dict[str, Dict[str, Any]] = {v["id"]: deepcopy(v) for v in SEED_VEHICLES}
        self.history: List[Dict[str, Any]] = deepcopy(SEED_HISTORY)
        self.trips: Dict[str, Dict[str, Any]] = {}
        self.events: List[Dict[str, Any]] = []

    def get_stations(self, corridor: Optional[str] = None) -> List[Dict[str, Any]]:
        if supabase_client:
            try:
                query = supabase_client.table("ev_charging_stations").select("*")
                if corridor:
                    query = query.eq("corridor", corridor)
                res = query.execute()
                if res.data and len(res.data) > 0:
                    stations = []
                    for item in res.data:
                        conn_types = item.get("connector_types")
                        conn_str = conn_types[0] if (isinstance(conn_types, list) and len(conn_types) > 0) else item.get("connector_type", "CCS2")
                        lat = item.get("lat") if item.get("lat") is not None else item.get("latitude", 22.7196)
                        lng = item.get("lng") if item.get("lng") is not None else item.get("longitude", 75.8577)
                        stations.append({
                            "id": str(item.get("id")),
                            "name": item.get("name", "EV Charging Hub"),
                            "latitude": float(lat),
                            "longitude": float(lng),
                            "address": item.get("location") or item.get("address", "MP"),
                            "corridor": item.get("corridor") or corridor or "INDORE_UJJAIN",
                            "connector_type": conn_str,
                            "charging_power_kw": float(item.get("power_output_kw") or item.get("charging_power_kw") or 60.0),
                            "total_connectors": int(item.get("total_ports") or item.get("total_connectors") or 4),
                            "available_connectors": int(item.get("available_ports") or item.get("available_connectors") or 3),
                            "status": str(item.get("status", "AVAILABLE")).upper(),
                            "queue_length": int(item.get("queue_length") or (2 if str(item.get("status")).lower() == "busy" else 0)),
                            "estimated_wait_minutes": int(item.get("queue_estimate_mins") or item.get("estimated_wait_minutes") or 0),
                            "price_per_kwh": float(item.get("tariff_per_kwh") or item.get("price_per_kwh") or 18.5),
                            "amenities": item.get("amenities") or ["Restroom"]
                        })
                    return stations
            except Exception as e:
                logger.warning(f"Failed to query Supabase ev_charging_stations: {e}. Using local store.")
        if corridor:
            return [s for s in self.stations.values() if s.get("corridor") == corridor]
        return list(self.stations.values())

    def get_station(self, station_id: str) -> Optional[Dict[str, Any]]:
        if supabase_client:
            try:
                res = supabase_client.table("ev_charging_stations").select("*").eq("id", station_id).execute()
                if res.data and len(res.data) > 0:
                    item = res.data[0]
                    conn_types = item.get("connector_types")
                    conn_str = conn_types[0] if (isinstance(conn_types, list) and len(conn_types) > 0) else item.get("connector_type", "CCS2")
                    lat = item.get("lat") if item.get("lat") is not None else item.get("latitude", 22.7196)
                    lng = item.get("lng") if item.get("lng") is not None else item.get("longitude", 75.8577)
                    return {
                        "id": str(item.get("id")),
                        "name": item.get("name", "EV Charging Hub"),
                        "latitude": float(lat),
                        "longitude": float(lng),
                        "address": item.get("location") or item.get("address", "MP"),
                        "corridor": item.get("corridor") or "INDORE_UJJAIN",
                        "connector_type": conn_str,
                        "charging_power_kw": float(item.get("power_output_kw") or item.get("charging_power_kw") or 60.0),
                        "total_connectors": int(item.get("total_ports") or item.get("total_connectors") or 4),
                        "available_connectors": int(item.get("available_ports") or item.get("available_connectors") or 3),
                        "status": str(item.get("status", "AVAILABLE")).upper(),
                        "queue_length": int(item.get("queue_length") or 0),
                        "estimated_wait_minutes": int(item.get("queue_estimate_mins") or item.get("estimated_wait_minutes") or 0),
                        "price_per_kwh": float(item.get("tariff_per_kwh") or item.get("price_per_kwh") or 18.5),
                        "amenities": item.get("amenities") or ["Restroom"]
                    }
            except Exception as e:
                logger.warning(f"Error fetching station {station_id} from Supabase: {e}")
        return self.stations.get(station_id)

    def update_station(self, station_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        if supabase_client:
            try:
                db_updates = {}
                if "status" in updates:
                    db_updates["status"] = str(updates["status"]).lower()
                if "available_connectors" in updates:
                    db_updates["available_ports"] = updates["available_connectors"]
                if "queue_length" in updates:
                    db_updates["queue_length"] = updates["queue_length"]
                if db_updates:
                    supabase_client.table("ev_charging_stations").update(db_updates).eq("id", station_id).execute()
            except Exception as e:
                logger.warning(f"Error updating station {station_id} in Supabase: {e}")
        if station_id in self.stations:
            self.stations[station_id].update(updates)
            return self.stations[station_id]
        return None

    def get_vehicles(self) -> List[Dict[str, Any]]:
        return list(self.vehicles.values())

    def get_vehicle(self, vehicle_id: str) -> Optional[Dict[str, Any]]:
        return self.vehicles.get(vehicle_id)

    def add_vehicle(self, vehicle: Dict[str, Any]) -> Dict[str, Any]:
        self.vehicles[vehicle["id"]] = vehicle
        return vehicle

    def get_history(self) -> List[Dict[str, Any]]:
        return self.history

    def add_history_entry(self, entry: Dict[str, Any]):
        self.history.insert(0, entry)

    def save_trip(self, trip: Dict[str, Any]):
        self.trips[trip["id"]] = trip

    def get_trip(self, trip_id: str) -> Optional[Dict[str, Any]]:
        return self.trips.get(trip_id)


local_store = LocalStore()

# Supabase Client Wrapper
supabase_client = None

def init_supabase():
    global supabase_client
    if settings.SUPABASE_URL and settings.SUPABASE_KEY and settings.SUPABASE_URL != "https://your-project.supabase.co":
        try:
            from supabase import create_client, Client
            supabase_client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
            logger.info("Connected to Supabase PostgreSQL successfully.")
        except Exception as e:
            logger.warning(f"Failed to connect to Supabase: {e}. Falling back to LocalStore.")
            supabase_client = None
    else:
        logger.info("Running with LocalStore offline-first database.")


def get_db():
    """Returns local store interface with Supabase synchronizer when active."""
    return local_store
