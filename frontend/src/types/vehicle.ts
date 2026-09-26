export interface UserProfile {
  id?: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  auth_id?: string;
  created_at?: string;
}

export interface Vehicle {
  id: string;
  user_id: string;
  manufacturer: string;
  model: string;
  purchase_date: string;
  battery_capacity_kwh: number;
  battery_health_percent: number;
  connector_type: string;
  max_charging_power_kw: number;
  average_efficiency_kwh_per_km: number;
  current_soc_percent: number;
  known_issues?: string;
  created_at?: string;
}

export interface VehicleCreatePayload {
  manufacturer: string;
  model: string;
  purchase_date?: string;
  battery_capacity_kwh: number;
  battery_health_percent?: number;
  connector_type?: string;
  max_charging_power_kw?: number;
  average_efficiency_kwh_per_km?: number;
  current_soc_percent: number;
  known_issues?: string;
}
