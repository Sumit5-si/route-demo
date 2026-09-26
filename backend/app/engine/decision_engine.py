"""
EVoyage Decision Engine
Scores Route + Station combinations jointly using explainable multi-factor scoring.
"""
from typing import List, Dict, Any, Optional
from app.config import settings
from app.database.seed_data import CORRIDORS
from app.database.supabase_client import get_db
from app.engine.battery_model import BatteryModel
from app.engine.routing_service import RoutingService, haversine_distance_km
from app.engine.explainer import ExplainerEngine


class DecisionEngine:
    # Mode weights: (travel_time_w, charge_time_w, wait_time_w, cost_w, detour_w, risk_w)
    WEIGHTS = {
        "BALANCED": {
            "travel": 1.0,
            "charge": 1.0,
            "wait": 1.2,
            "cost": 0.8,
            "detour": 1.5,
            "risk": 2.0
        },
        "FASTEST": {
            "travel": 1.5,
            "charge": 1.3,
            "wait": 1.8,
            "cost": 0.2,
            "detour": 1.0,
            "risk": 2.5
        },
        "CHEAPEST": {
            "travel": 0.5,
            "charge": 0.8,
            "wait": 0.6,
            "cost": 2.2,
            "detour": 0.5,
            "risk": 2.0
        },
        "SAFEST": {
            "travel": 0.6,
            "charge": 0.8,
            "wait": 0.8,
            "cost": 0.5,
            "detour": 2.5,
            "risk": 5.0
        }
    }

    @classmethod
    async def evaluate_candidates(
        cls,
        origin: str,
        dest: str,
        corridor_key: str,
        current_soc: float,
        capacity_kwh: float = 40.5,
        health_percent: float = 95.0,
        efficiency_kwh_per_km: float = 0.145,
        temp_celsius: float = 32.0,
        preference_mode: str = "BALANCED",
        current_position: Optional[Dict[str, float]] = None
    ) -> List[Dict[str, Any]]:
        """
        Evaluates and ranks all charging station options along the corridor.
        """
        db = get_db()
        stations = db.get_stations(corridor=corridor_key)
        corridor_info = CORRIDORS.get(corridor_key, CORRIDORS["INDORE_UJJAIN"])
        
        origin_coords = current_position or corridor_info["origin"]
        dest_coords = corridor_info["destination"]
        
        # Calculate direct range remaining
        range_left_km = BatteryModel.calculate_estimated_range_km(
            capacity_kwh=capacity_kwh,
            current_soc_percent=current_soc,
            health_percent=health_percent,
            efficiency_kwh_per_km=efficiency_kwh_per_km,
            temp_celsius=temp_celsius
        )

        candidates = []

        for st in stations:
            st_lat = st["latitude"]
            st_lng = st["longitude"]
            
            # Distance from current vehicle position to station
            dist_to_station_km = haversine_distance_km(origin_coords["lat"], origin_coords["lng"], st_lat, st_lng)
            
            # Arrival SOC at station
            arrival_soc = BatteryModel.estimate_arrival_soc(
                current_soc_percent=current_soc,
                distance_km=dist_to_station_km,
                capacity_kwh=capacity_kwh,
                health_percent=health_percent,
                efficiency_kwh_per_km=efficiency_kwh_per_km,
                temp_celsius=temp_celsius
            )

            # Feasibility Check: Must arrive with >= MINIMUM_ARRIVAL_SOC (10%)
            # Also if station is OFFLINE, discard or heavily penalize
            is_feasible = (arrival_soc >= settings.MINIMUM_ARRIVAL_SOC) and (st.get("status") != "OFFLINE")
            if not is_feasible:
                continue

            # Detour from main corridor
            detour_km = RoutingService.calculate_detour(corridor_info["waypoints"], st_lat, st_lng)
            
            # Charging duration to 80% SOC
            target_soc = 80.0
            charge_mins, energy_kwh = BatteryModel.calculate_charging_duration_minutes(
                arrival_soc_percent=arrival_soc,
                target_soc_percent=target_soc,
                capacity_kwh=capacity_kwh,
                charger_power_kw=st.get("charging_power_kw", 60.0),
                vehicle_max_power_kw=50.0,
                health_percent=health_percent
            )

            # Waiting / queue time
            wait_mins = st.get("estimated_wait_minutes", 0)
            
            # Charging cost
            price_per_kwh = st.get("price_per_kwh", 18.0)
            cost_inr = round(energy_kwh * price_per_kwh, 2)

            # Total route stats with this station
            total_dist_km = corridor_info["distance_km"] + detour_km
            total_dur_mins = corridor_info["base_duration_minutes"] + int(detour_km * 1.5) + charge_mins + wait_mins
            
            # Calculate final SOC at destination after 80% charge at station
            dist_from_station_to_dest = haversine_distance_km(st_lat, st_lng, dest_coords["lat"], dest_coords["lng"])
            dest_arrival_soc = BatteryModel.estimate_arrival_soc(
                current_soc_percent=target_soc,
                distance_km=dist_from_station_to_dest,
                capacity_kwh=capacity_kwh,
                health_percent=health_percent,
                efficiency_kwh_per_km=efficiency_kwh_per_km,
                temp_celsius=temp_celsius
            )

            # Calculate Mode-based Score
            w = cls.WEIGHTS.get(preference_mode, cls.WEIGHTS["BALANCED"])
            
            # Risk penalty: higher penalty if arrival SOC is close to 10%
            risk_penalty = 0.0
            if arrival_soc < settings.PREFERRED_ARRIVAL_SOC:
                risk_penalty = (settings.PREFERRED_ARRIVAL_SOC - arrival_soc) * 15.0

            score = (
                w["travel"] * (total_dur_mins - charge_mins - wait_mins) +
                w["charge"] * charge_mins +
                w["wait"] * (wait_mins * 1.5) +
                w["cost"] * (cost_inr / 10.0) +
                w["detour"] * (detour_km * 4.0) +
                w["risk"] * risk_penalty
            )

            # Generate explainability reasons
            reasons = ExplainerEngine.explain_recommendation(
                station=st,
                arrival_soc=arrival_soc,
                detour_km=detour_km,
                charge_mins=charge_mins,
                preference_mode=preference_mode,
                price_per_kwh=price_per_kwh
            )

            candidates.append({
                "station": st,
                "score": round(score, 2),
                "arrival_soc": arrival_soc,
                "dest_arrival_soc": dest_arrival_soc,
                "detour_km": detour_km,
                "charge_mins": charge_mins,
                "wait_mins": wait_mins,
                "cost_inr": cost_inr,
                "total_dist_km": total_dist_km,
                "total_dur_mins": total_dur_mins,
                "why_recommended": reasons
            })

        # Sort by lowest score
        candidates.sort(key=lambda c: c["score"])
        return candidates
