import { supabase } from './supabaseClient';
import { UserProfile, Vehicle, VehicleCreatePayload } from '../types/vehicle';
import { ChargingStation } from '../types/station';
import { TripHistoryItem } from '../types/trip';

export interface DbUserRecord {
  id: string;
  email: string;
  name: string;
  phone?: string;
  address?: string;
  created_at?: string;
}

export const supabaseService = {
  /**
   * Register or upsert user into ev_users
   */
  registerUser: async (profile: UserProfile): Promise<DbUserRecord> => {
    try {
      const email = profile.email.toLowerCase().trim();
      const { data, error } = await supabase
        .from('ev_users')
        .upsert(
          {
            email: email,
            name: profile.name.trim(),
            phone: profile.phone?.trim() || null,
            address: profile.address?.trim() || 'Indore, MP',
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'email' }
        )
        .select()
        .single();

      if (error) {
        console.warn('Supabase registerUser warning:', error.message);
        // Fallback local mock user object if network or table issue
        return {
          id: profile.id || `local-${Date.now()}`,
          email: profile.email,
          name: profile.name,
          phone: profile.phone,
          address: profile.address,
        };
      }
      return data;
    } catch (err) {
      console.error('Error in registerUser:', err);
      return {
        id: profile.id || `local-${Date.now()}`,
        email: profile.email,
        name: profile.name,
        phone: profile.phone,
        address: profile.address,
      };
    }
  },

  /**
   * Sign in / lookup user by email or phone
   */
  findUserByEmailOrPhone: async (identifier: string): Promise<DbUserRecord | null> => {
    try {
      const clean = identifier.trim();
      const isEmail = clean.includes('@');

      const query = supabase.from('ev_users').select('*');
      const { data, error } = isEmail
        ? await query.eq('email', clean.toLowerCase()).maybeSingle()
        : await query.eq('phone', clean).maybeSingle();

      if (error) {
        console.warn('Supabase findUser error:', error.message);
        return null;
      }
      return data;
    } catch (err) {
      console.error('Error finding user:', err);
      return null;
    }
  },

  /**
   * Save vehicle for user
   */
  createVehicle: async (userId: string, payload: VehicleCreatePayload): Promise<Vehicle> => {
    try {
      const { data, error } = await supabase
        .from('ev_vehicles')
        .insert({
          user_id: userId.startsWith('local-') ? null : userId,
          manufacturer: payload.manufacturer,
          model: payload.model,
          purchase_date: payload.purchase_date || new Date().toISOString().split('T')[0],
          battery_capacity_kwh: payload.battery_capacity_kwh,
          battery_health_percent: payload.battery_health_percent ?? 95.0,
          connector_type: payload.connector_type || 'CCS2',
          max_charging_power_kw: payload.max_charging_power_kw || 50.0,
          average_efficiency_kwh_per_km: payload.average_efficiency_kwh_per_km || 0.145,
          current_soc_percent: payload.current_soc_percent || 72.0,
          known_issues: payload.known_issues || null,
        })
        .select()
        .single();

      if (error) {
        console.warn('Supabase createVehicle warning:', error.message);
        return {
          id: `veh-${Date.now()}`,
          user_id: userId,
          ...payload,
          purchase_date: payload.purchase_date || new Date().toISOString().split('T')[0],
          battery_health_percent: payload.battery_health_percent ?? 95.0,
          connector_type: payload.connector_type || 'CCS2',
          max_charging_power_kw: payload.max_charging_power_kw || 50.0,
          average_efficiency_kwh_per_km: payload.average_efficiency_kwh_per_km || 0.145,
          current_soc_percent: payload.current_soc_percent || 72.0,
          known_issues: payload.known_issues || '',
        };
      }
      return data;
    } catch (err) {
      console.error('Error creating vehicle:', err);
      return {
        id: `veh-${Date.now()}`,
        user_id: userId,
        ...payload,
        purchase_date: payload.purchase_date || new Date().toISOString().split('T')[0],
        battery_health_percent: payload.battery_health_percent ?? 95.0,
        connector_type: payload.connector_type || 'CCS2',
        max_charging_power_kw: payload.max_charging_power_kw || 50.0,
        average_efficiency_kwh_per_km: payload.average_efficiency_kwh_per_km || 0.145,
        current_soc_percent: payload.current_soc_percent || 72.0,
        known_issues: payload.known_issues || '',
      };
    }
  },

  /**
   * Get all vehicles belonging to user
   */
  getUserVehicles: async (userId: string): Promise<Vehicle[]> => {
    try {
      if (!userId || userId.startsWith('local-')) return [];
      const { data, error } = await supabase
        .from('ev_vehicles')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error || !data) return [];
      return data;
    } catch (err) {
      console.error('Error fetching user vehicles:', err);
      return [];
    }
  },

  /**
   * Fetch charging stations from Supabase
   */
  getChargingStations: async (): Promise<ChargingStation[]> => {
    try {
      const { data, error } = await supabase
        .from('ev_charging_stations')
        .select('*')
        .order('name');

      if (error || !data || data.length === 0) return [];

      return data.map((item) => ({
        id: String(item.id),
        name: item.name || 'EV Station',
        latitude: Number(item.lat ?? item.latitude ?? 22.7196),
        longitude: Number(item.lng ?? item.longitude ?? 75.8577),
        address: item.location || item.address || 'Highway Hub',
        corridor: item.corridor || 'INDORE_UJJAIN',
        connector_type: Array.isArray(item.connector_types) ? item.connector_types[0] : (item.connector_type || 'CCS2'),
        charging_power_kw: Number(item.power_output_kw ?? item.charging_power_kw) || 60,
        total_connectors: Number(item.total_ports ?? item.total_connectors) || 4,
        available_connectors: Number(item.available_ports ?? item.available_connectors) || 3,
        status: (String(item.status || 'AVAILABLE').toUpperCase()) as any,
        queue_length: Number(item.queue_length ?? (item.status?.toLowerCase() === 'busy' ? 2 : 0)),
        estimated_wait_minutes: Number(item.queue_estimate_mins ?? item.estimated_wait_minutes) || 0,
        price_per_kwh: Number(item.tariff_per_kwh ?? item.price_per_kwh) || 18.5,
        amenities: item.amenities || ['Restroom'],
      }));
    } catch (err) {
      console.error('Error fetching stations from Supabase:', err);
      return [];
    }
  },

  /**
   * Save trip history to Supabase
   */
  saveTrip: async (trip: Partial<TripHistoryItem>, userId?: string, vehicleId?: string): Promise<void> => {
    try {
      await supabase.from('ev_trips').insert({
        user_id: userId && !userId.startsWith('local-') ? userId : null,
        vehicle_id: vehicleId && !vehicleId.startsWith('local-') ? vehicleId : null,
        origin: trip.origin || 'Indore',
        destination: trip.destination || 'Bhopal',
        distance_km: trip.distance_km || 0,
        total_duration_mins: trip.duration_minutes || 0,
        charge_stops_count: trip.stops_count || 0,
        total_cost_inr: trip.cost_inr || 0,
        battery_start_soc: trip.initial_soc || 100,
        battery_end_soc: trip.final_soc || 20,
        status: trip.status || 'completed',
      });
    } catch (err) {
      console.warn('Could not save trip to Supabase:', err);
    }
  },

  /**
   * Get trip history from Supabase
   */
  getTripHistory: async (userId?: string): Promise<TripHistoryItem[]> => {
    try {
      const query = supabase
        .from('ev_trips')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (userId && !userId.startsWith('local-')) {
        query.eq('user_id', userId);
      }

      const { data, error } = await query;
      if (error || !data || data.length === 0) return [];

      return data.map((t) => ({
        id: t.id,
        date: new Date(t.created_at).toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        }),
        origin: t.origin,
        destination: t.destination,
        distance_km: Number(t.distance_km),
        duration_minutes: Number(t.total_duration_mins),
        stops_count: t.charge_stops_count || 0,
        charged_at: 'Tata Power / Jio-bp Hub',
        energy_kwh: Math.round(Number(t.distance_km) * 0.15),
        cost_inr: Number(t.total_cost_inr) || 280,
        route_changes: 0,
        initial_soc: Number(t.battery_start_soc) || 85,
        final_soc: Number(t.battery_end_soc) || 22,
        status: t.status || 'Completed',
      }));
    } catch (err) {
      console.error('Error loading trip history:', err);
      return [];
    }
  },
};
