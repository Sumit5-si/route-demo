import { ChargingStation } from './station';
import { RouteAlternative } from './trip';

export type EventType =
  | 'STATION_CONGESTION'
  | 'STATION_OFFLINE'
  | 'TRAFFIC_DELAY'
  | 'SOC_DROP_RAPID'
  | 'RESET_NORMAL';

export interface TriggerSimulationEventRequest {
  trip_id?: string;
  event_type: EventType;
  station_id?: string;
  target_wait_minutes?: number;
  traffic_delay_minutes?: number;
  soc_drop_percent?: number;
}

export interface SimulationEventResponse {
  success: boolean;
  event_type: string;
  message: string;
  previous_station_id?: string;
  new_station_id?: string;
  replan_triggered: boolean;
  explanation: string[];
  updated_route?: RouteAlternative;
}
