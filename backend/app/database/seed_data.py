"""
Realistic Seed Data for Corridors:
1. INDORE -> UJJAIN (~55 km)
2. INDORE -> MAHESHWAR (~90 km)
3. GWALIOR -> JAIPUR (~460 km)
"""

CORRIDORS = {
    "INDORE_UJJAIN": {
        "name": "Indore to Ujjain Expressway Corridor",
        "origin": {"name": "Indore, MP", "lat": 22.7196, "lng": 75.8577},
        "destination": {"name": "Ujjain, MP", "lat": 23.1765, "lng": 75.7885},
        "distance_km": 54.8,
        "base_duration_minutes": 65,
        "waypoints": [
            {"lat": 22.7196, "lng": 75.8577, "name": "Indore City Center"},
            {"lat": 22.7560, "lng": 75.8790, "name": "MR10 Junction"},
            {"lat": 22.8450, "lng": 75.8320, "name": "Sanwer Town"},
            {"lat": 23.0100, "lng": 75.8050, "name": "Ujjain Expressway Toll"},
            {"lat": 23.1550, "lng": 75.7720, "name": "Ujjain Ring Road"},
            {"lat": 23.1765, "lng": 75.7885, "name": "Mahakaleshwar, Ujjain"}
        ]
    },
    "INDORE_MAHESHWAR": {
        "name": "Indore to Maheshwar Narmada Ghat Corridor",
        "origin": {"name": "Indore, MP", "lat": 22.7196, "lng": 75.8577},
        "destination": {"name": "Maheshwar, MP", "lat": 22.1760, "lng": 75.5840},
        "distance_km": 91.2,
        "base_duration_minutes": 115,
        "waypoints": [
            {"lat": 22.7196, "lng": 75.8577, "name": "Indore Palasia"},
            {"lat": 22.6320, "lng": 75.8080, "name": "Rau Circle"},
            {"lat": 22.5530, "lng": 75.7620, "name": "Mhow Cantonment"},
            {"lat": 22.3850, "lng": 75.6650, "name": "Simrol Ghat Crest"},
            {"lat": 22.2150, "lng": 75.4720, "name": "Dhamnod Bypass"},
            {"lat": 22.1760, "lng": 75.5840, "name": "Ahilya Fort, Maheshwar"}
        ]
    },
    "GWALIOR_JAIPUR": {
        "name": "Gwalior to Jaipur Interstate Corridor",
        "origin": {"name": "Gwalior, MP", "lat": 26.2183, "lng": 78.1828},
        "destination": {"name": "Jaipur, RJ", "lat": 26.9124, "lng": 75.7873},
        "distance_km": 460.0,
        "base_duration_minutes": 460, # 7h 40m
        "waypoints": [
            {"lat": 26.2183, "lng": 78.1828, "name": "Gwalior Fort Point"},
            {"lat": 26.7020, "lng": 77.8960, "name": "Dholpur Highway Junction"},
            {"lat": 27.2180, "lng": 77.4920, "name": "Bharatpur Entry"},
            {"lat": 27.0450, "lng": 76.9280, "name": "Mahwa Toll Plaza"},
            {"lat": 26.8920, "lng": 76.3350, "name": "Dausa Bypass"},
            {"lat": 26.8750, "lng": 75.8920, "name": "Jaipur Ring Road"},
            {"lat": 26.9124, "lng": 75.7873, "name": "Jaipur City Center"}
        ]
    }
}

# SEED_STATIONS is kept empty so all station data comes dynamically from Supabase database
SEED_STATIONS = []

SEED_VEHICLES = [
    {
        "id": "demo-veh-1",
        "user_id": "demo-user-1",
        "manufacturer": "Tata Motors",
        "model": "Nexon EV Max",
        "purchase_date": "2023-04-10",
        "battery_capacity_kwh": 40.5,
        "battery_health_percent": 95.0,
        "connector_type": "CCS2",
        "max_charging_power_kw": 50.0,
        "average_efficiency_kwh_per_km": 0.145, # ~6.9 km/kWh
        "current_soc_percent": 42.0,
        "created_at": "2024-01-15T10:00:00Z"
    },
    {
        "id": "demo-veh-2",
        "user_id": "demo-user-1",
        "manufacturer": "MG Motors",
        "model": "ZS EV Long Range",
        "purchase_date": "2023-08-20",
        "battery_capacity_kwh": 50.3,
        "battery_health_percent": 97.0,
        "connector_type": "CCS2",
        "max_charging_power_kw": 80.0,
        "average_efficiency_kwh_per_km": 0.155, # ~6.45 km/kWh
        "current_soc_percent": 68.0,
        "created_at": "2024-02-01T11:30:00Z"
    },
    {
        "id": "demo-veh-3",
        "user_id": "demo-user-1",
        "manufacturer": "Hyundai",
        "model": "Ioniq 5",
        "purchase_date": "2023-11-05",
        "battery_capacity_kwh": 72.6,
        "battery_health_percent": 99.0,
        "connector_type": "CCS2",
        "max_charging_power_kw": 150.0,
        "average_efficiency_kwh_per_km": 0.165,
        "current_soc_percent": 82.0,
        "created_at": "2024-02-20T09:15:00Z"
    }
]

SEED_HISTORY = [
    {
        "id": "trip-hist-1",
        "date": "2026-09-24",
        "origin": "Indore, MP",
        "destination": "Ujjain, MP",
        "distance_km": 54.8,
        "duration_minutes": 68,
        "stops_count": 1,
        "charged_at": "Sanwer Road FastCharge Hub",
        "energy_kwh": 7.9,
        "cost_inr": 138.25,
        "route_changes": 0,
        "initial_soc": 38.0,
        "final_soc": 74.0,
        "status": "COMPLETED"
    },
    {
        "id": "trip-hist-2",
        "date": "2026-09-21",
        "origin": "Indore, MP",
        "destination": "Maheshwar, MP",
        "distance_km": 91.2,
        "duration_minutes": 118,
        "stops_count": 1,
        "charged_at": "Mhow Valley Highway Power",
        "energy_kwh": 13.2,
        "cost_inr": 250.80,
        "route_changes": 1,
        "initial_soc": 55.0,
        "final_soc": 68.0,
        "status": "COMPLETED"
    }
]
