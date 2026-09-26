"""
EVoyage Mathematical Battery Model
Calculates usable energy, safe reachable range, temperature adjustments, and arrival SOC.
"""
from typing import Dict, Any, Tuple
from app.config import settings


class BatteryModel:
    @staticmethod
    def calculate_usable_energy_kwh(
        capacity_kwh: float,
        current_soc_percent: float,
        health_percent: float = 95.0
    ) -> float:
        """
        usable_energy = battery_capacity * current_soc * battery_health_factor
        """
        health_factor = max(0.5, min(1.0, health_percent / 100.0))
        soc_factor = max(0.0, min(1.0, current_soc_percent / 100.0))
        return round(capacity_kwh * soc_factor * health_factor, 2)

    @staticmethod
    def calculate_temperature_efficiency_multiplier(temp_celsius: float = 32.0) -> float:
        """
        Calculates efficiency degradation based on ambient temperature.
        Optimal range is ~20°C - 30°C.
        High temperatures (>35°C) increase AC load.
        Low temperatures (<15°C) increase battery internal resistance.
        """
        if temp_celsius < 20.0:
            penalty = (20.0 - temp_celsius) * 0.008
            return round(1.0 - min(0.3, penalty), 3)
        elif temp_celsius > 30.0:
            penalty = (temp_celsius - 30.0) * 0.006
            return round(1.0 - min(0.2, penalty), 3)
        return 1.0

    @classmethod
    def calculate_estimated_range_km(
        cls,
        capacity_kwh: float,
        current_soc_percent: float,
        health_percent: float = 95.0,
        efficiency_kwh_per_km: float = 0.145,
        temp_celsius: float = 32.0,
        safety_reserve_percent: float = 12.0
    ) -> float:
        """
        estimated_range = (usable_energy * (1 - safety_reserve)) / (efficiency / temp_multiplier)
        """
        usable_energy = cls.calculate_usable_energy_kwh(capacity_kwh, current_soc_percent, health_percent)
        temp_multiplier = cls.calculate_temperature_efficiency_multiplier(temp_celsius)
        effective_efficiency = max(0.08, efficiency_kwh_per_km / temp_multiplier)
        
        usable_energy_with_buffer = usable_energy * (1.0 - (safety_reserve_percent / 100.0))
        range_km = usable_energy_with_buffer / effective_efficiency
        return round(max(0.0, range_km), 1)

    @classmethod
    def estimate_arrival_soc(
        cls,
        current_soc_percent: float,
        distance_km: float,
        capacity_kwh: float,
        health_percent: float = 95.0,
        efficiency_kwh_per_km: float = 0.145,
        temp_celsius: float = 32.0
    ) -> float:
        """
        arrival_soc = current_soc - (energy_consumed / total_capacity) * 100
        """
        temp_multiplier = cls.calculate_temperature_efficiency_multiplier(temp_celsius)
        effective_efficiency = efficiency_kwh_per_km / temp_multiplier
        energy_consumed = distance_km * effective_efficiency
        
        health_factor = max(0.5, min(1.0, health_percent / 100.0))
        effective_total_capacity = capacity_kwh * health_factor
        
        soc_consumed = (energy_consumed / effective_total_capacity) * 100.0
        return round(current_soc_percent - soc_consumed, 1)

    @staticmethod
    def calculate_charging_duration_minutes(
        arrival_soc_percent: float,
        target_soc_percent: float,
        capacity_kwh: float,
        charger_power_kw: float,
        vehicle_max_power_kw: float = 50.0,
        health_percent: float = 95.0
    ) -> Tuple[int, float]:
        """
        Calculates charging time in minutes and total energy charged in kWh.
        Tapering factor included for >80% SOC.
        """
        if arrival_soc_percent >= target_soc_percent:
            return 0, 0.0

        health_factor = max(0.5, min(1.0, health_percent / 100.0))
        effective_capacity = capacity_kwh * health_factor
        
        soc_to_add = target_soc_percent - arrival_soc_percent
        energy_kwh = (soc_to_add / 100.0) * effective_capacity
        
        effective_power = min(charger_power_kw, vehicle_max_power_kw)
        # Charging efficiency ~ 90%
        net_power = effective_power * 0.90
        
        hours = energy_kwh / max(5.0, net_power)
        duration_minutes = max(5, int(round(hours * 60)))
        return duration_minutes, round(energy_kwh, 2)
