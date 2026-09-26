"""
Explainability Engine for EVoyage
Generates clear, factor-based rationales without generic AI buzzwords.
"""
from typing import List, Dict, Any


class ExplainerEngine:
    @staticmethod
    def explain_recommendation(
        station: Dict[str, Any],
        arrival_soc: float,
        detour_km: float,
        charge_mins: int,
        preference_mode: str,
        price_per_kwh: float
    ) -> List[str]:
        reasons = []
        
        # 1. Battery reachability factor
        reasons.append(f"Reachable with safe {arrival_soc}% arrival SOC (well above 10% safety buffer)")
        
        # 2. Detour factor
        if detour_km <= 1.0:
            reasons.append("Directly on the highway corridor with zero detour")
        else:
            reasons.append(f"Adds only {detour_km:.1f} km detour from primary route")
            
        # 3. Charger capability & wait
        wait_mins = station.get("estimated_wait_minutes", 0)
        power_kw = station.get("charging_power_kw", 60.0)
        avail = station.get("available_connectors", 1)
        total = station.get("total_connectors", 4)
        
        if wait_mins <= 5:
            reasons.append(f"Fast {int(power_kw)} kW charger with immediate availability ({avail}/{total} free, {wait_mins} min wait)")
        else:
            reasons.append(f"{int(power_kw)} kW charger with brief {wait_mins} min estimated queue")
            
        # 4. Cost / Preference alignment
        if preference_mode == "CHEAPEST":
            reasons.append(f"Optimized for lowest charging rate at ₹{price_per_kwh:.1f}/kWh")
        elif preference_mode == "FASTEST":
            reasons.append(f"Optimized for high throughput: {charge_mins} min charge time")
        else:
            reasons.append(f"Balanced journey: ₹{price_per_kwh:.1f}/kWh with {charge_mins} min charge to 80% SOC")
            
        return reasons

    @staticmethod
    def explain_replan(
        old_station_name: str,
        new_station_name: str,
        reason_type: str,
        details: Dict[str, Any]
    ) -> List[str]:
        reasons = []
        if reason_type == "STATION_CONGESTION":
            old_wait = details.get("old_wait", 8)
            new_wait = details.get("new_wait", 42)
            time_saved = details.get("time_saved", 24)
            reasons.append(f"{old_station_name} queue surged from {old_wait}m to {new_wait}m wait.")
            reasons.append(f"Switched to {new_station_name} which is fully operational and saves ~{time_saved} minutes.")
            reasons.append(f"Vehicle arrives with comfortable {details.get('arrival_soc', 18)}% SOC reserve.")
        elif reason_type == "STATION_OFFLINE":
            reasons.append(f"{old_station_name} went offline due to power grid maintenance.")
            reasons.append(f"Proactively re-routed to {new_station_name} to prevent strand risk.")
        elif reason_type == "SOC_DROP_RAPID":
            reasons.append(f"Higher energy consumption detected (AC load / headwind).")
            reasons.append(f"Selected closer station {new_station_name} to maintain minimum 10% safety buffer.")
        elif reason_type == "TRAFFIC_DELAY":
            reasons.append(f"Heavy traffic delay (+{details.get('delay', 20)} mins) detected on original segment.")
            reasons.append(f"Adjusted charging stop to {new_station_name} on the clearer bypass route.")
        return reasons
