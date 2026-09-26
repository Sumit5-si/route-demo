import { ChargingStation } from './station';

export interface LatLng {
  lat: number;
  lng: number;
}

export interface RouteAlternative {
  id: string; // "BALANCED" | "FASTEST" | "CHEAPEST" | "SAFEST"
  name: string;
  badge?: string;
  total_duration_minutes: number;
  total_distance_km: number;
  stops_count: number;
  charging_duration_minutes: number;
  estimated_arrival_soc: number;
  estimated_cost_inr: number;
  score: number;
  recommended_station: ChargingStation;
  why_recommended: string[];
  polyline: LatLng[];
  waypoints: Array<{ lat: number; lng: number; name?: string }>;
}

export interface TripPlanRequest {
  origin: string;
  destination: string;
  corridor_key: string;
  vehicle_id?: string;
  current_soc_percent: number;
  battery_capacity_kwh?: number;
  battery_health_percent?: number;
  efficiency_kwh_per_km?: number;
  temperature_celsius?: number;
  preference_mode?: string;
}

export interface TripPlanResponse {
  trip_id: string;
  origin: string;
  destination: string;
  corridor_key: string;
  current_soc: number;
  estimated_range_km: number;
  temperature_celsius: number;
  recommended_route: RouteAlternative;
  alternatives: RouteAlternative[];
  nearby_stations: ChargingStation[];
}

export interface TripHistoryItem {
  id: string;
  date: string;
  origin: string;
  destination: string;
  distance_km: number;
  duration_minutes: number;
  stops_count: number;
  charged_at: string;
  energy_kwh: number;
  cost_inr: number;
  route_changes: number;
  initial_soc: number;
  final_soc: number;
  status: string;
}
