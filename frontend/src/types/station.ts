export type StationStatus = 'AVAILABLE' | 'BUSY' | 'OFFLINE';

export interface ChargingStation {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  address: string;
  corridor?: string;
  connector_type: string;
  charging_power_kw: number;
  total_connectors: number;
  available_connectors: number;
  status: StationStatus;
  queue_length: number;
  estimated_wait_minutes: number;
  price_per_kwh: number;
  last_updated?: string;
  amenities?: string[];
}
