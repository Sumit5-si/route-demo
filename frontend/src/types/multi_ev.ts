import { ChargingStation } from './station';

export interface MultiEVVehicleState {
  vehicle_id: string;
  vehicle_name: string;
  soc_percent: number;
  battery_capacity_kwh: number;
  efficiency_kwh_per_km: number;
  current_distance_from_origin_km: number;
  uncoordinated_station_id: string;
  coordinated_station_id: string;
  arrival_soc_percent: number;
  estimated_wait_minutes: number;
  charging_duration_minutes: number;
  status: 'EN_ROUTE' | 'CHARGING' | 'ARRIVED';
}

export interface MultiEVSimulationResult {
  session_id: string;
  corridor: string;
  vehicles: MultiEVVehicleState[];
  stations: ChargingStation[];
  before_coordination: {
    description: string;
    station_loads: Record<string, { vehicles: number; queue_minutes: number; status: string }>;
    max_queue_minutes: number;
    bottleneck_station: string;
  };
  after_coordination: {
    description: string;
    station_loads: Record<string, { vehicles: number; queue_minutes: number; status: string }>;
    max_queue_minutes: number;
    bottleneck_station: string;
  };
  metrics: {
    total_vehicles: number;
    uncoordinated_avg_wait_minutes: number;
    coordinated_avg_wait_minutes: number;
    wait_time_reduction_percent: number;
    energy_delivered_kwh: number;
    corridor_congestion_index: string;
  };
  insights: string[];
}
