import { apiClient } from './api';
import { TripPlanRequest, TripPlanResponse, TripHistoryItem } from '../types/trip';
import { Vehicle, VehicleCreatePayload } from '../types/vehicle';
import { ChargingStation } from '../types/station';
import { TriggerSimulationEventRequest, SimulationEventResponse } from '../types/simulation';
import { MultiEVSimulationResult } from '../types/multi_ev';

export const tripService = {
  planTrip: async (payload: TripPlanRequest): Promise<TripPlanResponse> => {
    const response = await apiClient.post<TripPlanResponse>('/trips/plan', payload);
    return response.data;
  },

  startTrip: async (tripId: string): Promise<any> => {
    const response = await apiClient.post(`/trips/${tripId}/start`);
    return response.data;
  },

  getHistory: async (): Promise<TripHistoryItem[]> => {
    const response = await apiClient.get<TripHistoryItem[]>('/history');
    return response.data;
  }
};

export const stationService = {
  getStations: async (corridor?: string): Promise<ChargingStation[]> => {
    const response = await apiClient.get<ChargingStation[]>('/stations', {
      params: { corridor }
    });
    return response.data;
  }
};

export const vehicleService = {
  getVehicles: async (): Promise<Vehicle[]> => {
    const response = await apiClient.get<Vehicle[]>('/vehicles');
    return response.data;
  },

  createVehicle: async (payload: VehicleCreatePayload): Promise<Vehicle> => {
    const response = await apiClient.post<Vehicle>('/vehicles', payload);
    return response.data;
  }
};

export const simulationService = {
  triggerEvent: async (payload: TriggerSimulationEventRequest): Promise<SimulationEventResponse> => {
    const response = await apiClient.post<SimulationEventResponse>('/simulation/events', payload);
    return response.data;
  },

  getMultiEVSimulation: async (corridor: string = 'INDORE_UJJAIN'): Promise<MultiEVSimulationResult> => {
    const response = await apiClient.get<MultiEVSimulationResult>('/multi-ev/simulate', {
      params: { corridor }
    });
    return response.data;
  }
};
