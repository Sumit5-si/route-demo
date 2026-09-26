import React, { createContext, useContext, useState, useEffect } from 'react';
import { Vehicle, VehicleCreatePayload, UserProfile } from '../types/vehicle';
import { supabaseService } from '../services/supabaseService';

interface VehicleContextType {
  userProfile: UserProfile | null;
  saveUserProfile: (profile: UserProfile) => Promise<UserProfile>;
  signInUser: (identifier: string) => Promise<{ success: boolean; message?: string }>;
  signOut: () => void;
  isFirstTimeUser: boolean;
  setIsFirstTimeUser: (val: boolean) => void;
  vehicles: Vehicle[];
  selectedVehicle: Vehicle | null;
  setSelectedVehicle: (vehicle: Vehicle) => void;
  addVehicle: (vehicle: VehicleCreatePayload) => Promise<Vehicle>;
  updateSOC: (soc: number) => void;
  loading: boolean;
  dbSyncStatus: 'synced' | 'syncing' | 'offline';
}

const VehicleContext = createContext<VehicleContextType | undefined>(undefined);

const DEFAULT_DEMO_VEHICLES: Vehicle[] = [
  {
    id: 'demo-veh-1',
    user_id: 'demo-user-1',
    manufacturer: 'Tata Motors',
    model: 'Nexon EV Max',
    purchase_date: '2022-06-15',
    battery_capacity_kwh: 40.5,
    battery_health_percent: 92.0,
    connector_type: 'CCS2',
    max_charging_power_kw: 50.0,
    average_efficiency_kwh_per_km: 0.145,
    current_soc_percent: 72.0,
    known_issues: 'Slight highway degradation',
  },
  {
    id: 'demo-veh-2',
    user_id: 'demo-user-1',
    manufacturer: 'MG Motors',
    model: 'ZS EV Long Range',
    purchase_date: '2023-08-20',
    battery_capacity_kwh: 50.3,
    battery_health_percent: 96.0,
    connector_type: 'CCS2',
    max_charging_power_kw: 80.0,
    average_efficiency_kwh_per_km: 0.155,
    current_soc_percent: 68.0,
    known_issues: '',
  },
];

export const VehicleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => {
    try {
      const stored = localStorage.getItem('evoyage_user_profile');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [isFirstTimeUser, setIsFirstTimeUser] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem('evoyage_user_profile');
      return !stored;
    } catch {
      return true;
    }
  });

  const [vehicles, setVehicles] = useState<Vehicle[]>(() => {
    try {
      const stored = localStorage.getItem('evoyage_user_vehicles');
      if (stored) return JSON.parse(stored);
    } catch {}
    return DEFAULT_DEMO_VEHICLES;
  });

  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(vehicles[0] || null);
  const [loading, setLoading] = useState(false);
  const [dbSyncStatus, setDbSyncStatus] = useState<'synced' | 'syncing' | 'offline'>('synced');

  // Sync vehicles to localStorage
  useEffect(() => {
    if (vehicles.length > 0) {
      try {
        localStorage.setItem('evoyage_user_vehicles', JSON.stringify(vehicles));
      } catch {}
    }
  }, [vehicles]);

  // Load user's vehicles from Supabase if userProfile exists
  useEffect(() => {
    const fetchDbVehicles = async () => {
      if (userProfile?.id && !userProfile.id.startsWith('local-')) {
        setDbSyncStatus('syncing');
        const dbVehicles = await supabaseService.getUserVehicles(userProfile.id);
        if (dbVehicles && dbVehicles.length > 0) {
          setVehicles(dbVehicles);
          setSelectedVehicle(dbVehicles[0]);
        }
        setDbSyncStatus('synced');
      }
    };
    fetchDbVehicles();
  }, [userProfile?.id]);

  const saveUserProfile = async (profile: UserProfile): Promise<UserProfile> => {
    setLoading(true);
    setDbSyncStatus('syncing');
    try {
      // 1. Save / Upsert to Supabase
      const dbUser = await supabaseService.registerUser(profile);
      const updatedProfile: UserProfile = {
        ...profile,
        id: dbUser.id,
      };

      // 2. Save locally
      setUserProfile(updatedProfile);
      setIsFirstTimeUser(false);
      localStorage.setItem('evoyage_user_profile', JSON.stringify(updatedProfile));
      setDbSyncStatus('synced');
      return updatedProfile;
    } catch (err) {
      console.error('Error saving user profile:', err);
      setUserProfile(profile);
      setIsFirstTimeUser(false);
      localStorage.setItem('evoyage_user_profile', JSON.stringify(profile));
      setDbSyncStatus('offline');
      return profile;
    } finally {
      setLoading(false);
    }
  };

  const signInUser = async (identifier: string): Promise<{ success: boolean; message?: string }> => {
    setLoading(true);
    setDbSyncStatus('syncing');
    try {
      const dbUser = await supabaseService.findUserByEmailOrPhone(identifier);
      if (!dbUser) {
        // Check if demo user identifier
        if (identifier.toLowerCase().includes('abhay') || identifier.toLowerCase().includes('demo')) {
          const demoProf: UserProfile = {
            id: 'demo-abhay-1',
            name: 'Abhay Sharma',
            email: 'abhay.sharma@evoyage.ai',
            phone: '+91 98765 43210',
            address: 'Vijay Nagar, Indore, MP',
          };
          setUserProfile(demoProf);
          setIsFirstTimeUser(false);
          setVehicles(DEFAULT_DEMO_VEHICLES);
          setSelectedVehicle(DEFAULT_DEMO_VEHICLES[0]);
          localStorage.setItem('evoyage_user_profile', JSON.stringify(demoProf));
          setDbSyncStatus('synced');
          return { success: true };
        }
        return { success: false, message: 'Driver account not found. Please register as a new driver.' };
      }

      const prof: UserProfile = {
        id: dbUser.id,
        name: dbUser.name,
        email: dbUser.email,
        phone: dbUser.phone || '',
        address: dbUser.address || '',
      };

      setUserProfile(prof);
      setIsFirstTimeUser(false);
      localStorage.setItem('evoyage_user_profile', JSON.stringify(prof));

      // Fetch vehicles from Supabase
      const userVehs = await supabaseService.getUserVehicles(dbUser.id);
      if (userVehs && userVehs.length > 0) {
        setVehicles(userVehs);
        setSelectedVehicle(userVehs[0]);
      }
      setDbSyncStatus('synced');
      return { success: true };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Failed to sign in' };
    } finally {
      setLoading(false);
    }
  };

  const signOut = () => {
    setUserProfile(null);
    setIsFirstTimeUser(true);
    localStorage.removeItem('evoyage_user_profile');
    localStorage.removeItem('evoyage_user_vehicles');
  };

  const updateSOC = (newSoc: number) => {
    if (!selectedVehicle) return;
    const clamped = Math.max(5, Math.min(100, Math.round(newSoc)));
    const updated = { ...selectedVehicle, current_soc_percent: clamped };
    setSelectedVehicle(updated);
    setVehicles((prev) => prev.map((v) => (v.id === updated.id ? updated : v)));
  };

  const calculateSOH = (purchaseDate?: string, knownIssues?: string): number => {
    let soh = 100;
    if (purchaseDate) {
      const diffMs = Date.now() - new Date(purchaseDate).getTime();
      const years = diffMs / (1000 * 60 * 60 * 24 * 365.25);
      if (years > 0) {
        soh -= Math.min(30, years * 3.2); // realistic Li-ion degradation curve
      }
    }
    if (knownIssues && knownIssues.trim().length > 0) {
      soh -= 4.0;
    }
    return Math.max(55, Math.round(soh * 10) / 10);
  };

  const addVehicle = async (payload: VehicleCreatePayload): Promise<Vehicle> => {
    const computedHealth = payload.battery_health_percent ?? calculateSOH(payload.purchase_date, payload.known_issues);
    const userId = userProfile?.id || 'local-user';

    setDbSyncStatus('syncing');
    const created = await supabaseService.createVehicle(userId, {
      ...payload,
      battery_health_percent: computedHealth,
    });

    setVehicles((prev) => [created, ...prev]);
    setSelectedVehicle(created);
    setDbSyncStatus('synced');
    return created;
  };

  return (
    <VehicleContext.Provider
      value={{
        userProfile,
        saveUserProfile,
        signInUser,
        signOut,
        isFirstTimeUser,
        setIsFirstTimeUser,
        vehicles,
        selectedVehicle,
        setSelectedVehicle,
        addVehicle,
        updateSOC,
        loading,
        dbSyncStatus,
      }}
    >
      {children}
    </VehicleContext.Provider>
  );
};

export const useVehicle = () => {
  const context = useContext(VehicleContext);
  if (!context) throw new Error('useVehicle must be used within VehicleProvider');
  return context;
};
