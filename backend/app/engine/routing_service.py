"""
Routing Service
Integrates with Google Maps Routes API (TRAFFIC_AWARE) with graceful deterministic fallback
for offline-first hackathon demonstration.
"""
import math
import httpx
from typing import Dict, Any, List, Optional
from app.config import settings
from app.database.seed_data import CORRIDORS


def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculates great circle distance in kilometers."""
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2.0) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2.0) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(R * c, 2)


class RoutingService:
    @classmethod
    async def get_route(
        cls,
        origin_name: str,
        dest_name: str,
        corridor_key: Optional[str] = "INDORE_UJJAIN",
        intermediate_stops: Optional[List[Dict[str, float]]] = None
    ) -> Dict[str, Any]:
        """
        Requests traffic-aware route. If Google API key is absent or request fails,
        returns high-precision seed corridor route.
        """
        # 1. Try Google Routes API if key is present
        if settings.GOOGLE_MAPS_API_KEY and not settings.DEMO_MODE:
            try:
                # Call Google Routes API
                url = "https://routes.googleapis.com/directions/v2:computeRoutes"
                headers = {
                    "Content-Type": "application/json",
                    "X-Goog-Api-Key": settings.GOOGLE_MAPS_API_KEY,
                    "X-Goog-FieldMask": "routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline"
                }
                payload = {
                    "origin": {"address": origin_name},
                    "destination": {"address": dest_name},
                    "travelMode": "DRIVE",
                    "routingPreference": "TRAFFIC_AWARE"
                }
                async with httpx.AsyncClient(timeout=4.0) as client:
                    resp = await client.post(url, json=payload, headers=headers)
                    if resp.status_code == 200:
                        data = resp.json()
                        route = data["routes"][0]
                        dist_km = round(route.get("distanceMeters", 55000) / 1000.0, 1)
                        dur_sec = int(route.get("duration", "3600s").replace("s", ""))
                        dur_min = int(dur_sec / 60)
                        return {
                            "source": "GOOGLE_ROUTES_API",
                            "distance_km": dist_km,
                            "duration_minutes": dur_min,
                            "encoded_polyline": route.get("polyline", {}).get("encodedPolyline", "")
                        }
            except Exception:
                pass # Gracefully fall back to deterministic corridor

        # 2. Deterministic Corridor Fallback
        corridor = CORRIDORS.get(corridor_key, CORRIDORS["INDORE_UJJAIN"])
        dist_km = corridor["distance_km"]
        dur_min = corridor["base_duration_minutes"]

        # Calculate detour if intermediate stop added
        if intermediate_stops:
            for stop in intermediate_stops:
                stop_lat = stop.get("lat", 0.0)
                stop_lng = stop.get("lng", 0.0)
                # Estimate detour
                detour = cls.calculate_detour(corridor["waypoints"], stop_lat, stop_lng)
                dist_km += detour
                dur_min += int(detour * 1.5)

        polyline = [
            {"lat": wp["lat"], "lng": wp["lng"]}
            for wp in corridor["waypoints"]
        ]

        return {
            "source": "CORRIDOR_SEED_ENGINE",
            "distance_km": round(dist_km, 1),
            "duration_minutes": dur_min,
            "polyline": polyline,
            "waypoints": corridor["waypoints"]
        }

    @staticmethod
    def calculate_detour(
        waypoints: List[Dict[str, Any]],
        station_lat: float,
        station_lng: float
    ) -> float:
        """
        Calculates minimum detour distance from any segment on the route to the charging station.
        """
        min_dist = float("inf")
        for wp in waypoints:
            d = haversine_distance_km(wp["lat"], wp["lng"], station_lat, station_lng)
            if d < min_dist:
                min_dist = d
        
        # Round trip to/from highway corridor
        detour = max(0.0, (min_dist * 1.8) - 1.0)
        return round(detour, 1)
