import { ChargingStation } from '../types/station';

/**
 * All stations are dynamically loaded from Supabase PostgreSQL database.
 * No hardcoded stations are stored here.
 */
export const ALL_EV_DATASET_STATIONS: ChargingStation[] = [];
