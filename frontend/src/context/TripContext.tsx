import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { TripPlanResponse, RouteAlternative, TripHistoryItem } from '../types/trip';
import { ChargingStation } from '../types/station';
import { tripService } from '../services/tripService';
import { supabaseService } from '../services/supabaseService';
import { wsClient } from '../services/websocketService';
import { useVehicle } from './VehicleContext';

export interface DriveMetrics {
  distanceTraveledKm: number;
  totalDistanceKm: number;
  currentSpeedKmph: number;
  elapsedTimeMins: number;
  currentDriveSoc: number;
  nextStopName: string;
  nextStopDistanceKm: number;
  nextStopEtaMins: number;
}

export interface ReplanBannerData {
  show: boolean;
  title: string;
  reasons: string[];
  previousStationName?: string;
  newStationName?: string;
  timeSavedMinutes?: number;
}

interface TripContextType {
  origin: string;
  destination: string;
  corridorKey: string;
  setCorridorKey: (key: string) => void;
  setOrigin: (origin: string) => void;
  setDestination: (destination: string) => void;
  preferenceMode: string;
  setPreferenceMode: (mode: string) => void;
  tripPlan: TripPlanResponse | null;
  selectedRoute: RouteAlternative | null;
  setSelectedRoute: (route: RouteAlternative) => void;
  nearbyStations: ChargingStation[];
  setNearbyStations: React.Dispatch<React.SetStateAction<ChargingStation[]>>;
  isTripActive: boolean;
  isPlanning: boolean;
  planRoute: (mode?: string) => Promise<void>;
  startTrip: () => void;
  stopTrip: () => void;
  driveMetrics: DriveMetrics;
  lastCompletedTrip: Partial<TripHistoryItem> | null;
  isCompletionModalOpen: boolean;
  setIsCompletionModalOpen: (val: boolean) => void;
  replanBanner: ReplanBannerData | null;
  dismissReplanBanner: () => void;
  selectedStation: ChargingStation | null;
  setSelectedStation: (station: ChargingStation | null) => void;
}

const TripContext = createContext<TripContextType | undefined>(undefined);

export const TripProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { selectedVehicle, userProfile, updateSOC } = useVehicle();

  const [origin, setOrigin] = useState('Indore, MP');
  const [destination, setDestination] = useState('Ujjain, MP');
  const [corridorKey, setCorridorKey] = useState('INDORE_UJJAIN');
  const [preferenceMode, setPreferenceMode] = useState('BALANCED');

  const [tripPlan, setTripPlan] = useState<TripPlanResponse | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<RouteAlternative | null>(null);
  const [nearbyStations, setNearbyStations] = useState<ChargingStation[]>([]);
  const [selectedStation, setSelectedStation] = useState<ChargingStation | null>(null);

  const [isTripActive, setIsTripActive] = useState(false);
  const [isPlanning, setIsPlanning] = useState(false);
  const [replanBanner, setReplanBanner] = useState<ReplanBannerData | null>(null);

  const [lastCompletedTrip, setLastCompletedTrip] = useState<Partial<TripHistoryItem> | null>(null);
  const [isCompletionModalOpen, setIsCompletionModalOpen] = useState(false);

  // Live Drive Simulation Metrics
  const [driveMetrics, setDriveMetrics] = useState<DriveMetrics>({
    distanceTraveledKm: 0,
    totalDistanceKm: 55,
    currentSpeedKmph: 0,
    elapsedTimeMins: 0,
    currentDriveSoc: 72,
    nextStopName: 'Tata Power Fast DC Hub',
    nextStopDistanceKm: 18,
    nextStopEtaMins: 16,
  });

  const driveTimerRef = useRef<any>(null);

  // Sync corridor origin/dest when corridor changed
  useEffect(() => {
    if (corridorKey === 'INDORE_UJJAIN') {
      setOrigin('Indore, MP');
      setDestination('Ujjain, MP');
    } else if (corridorKey === 'INDORE_MAHESHWAR') {
      setOrigin('Indore, MP');
      setDestination('Maheshwar, MP');
    } else if (corridorKey === 'GWALIOR_JAIPUR') {
      setOrigin('Gwalior, MP');
      setDestination('Jaipur, RJ');
    } else if (corridorKey === 'INDORE_BHOPAL') {
      setOrigin('Indore, MP');
      setDestination('Bhopal, MP');
    }
  }, [corridorKey]);

  // Initial plan load
  useEffect(() => {
    planRoute(preferenceMode);
  }, [corridorKey, selectedVehicle?.id]);

  // WebSocket dynamic replan listener
  useEffect(() => {
    wsClient.connect(tripPlan?.trip_id || 'global');

    const unsubscribe = wsClient.subscribe((msg) => {
      if (msg.type === 'TRIP_REPLANNED') {
        console.log('[TripContext] Received TRIP_REPLANNED event:', msg);

        if (msg.updated_route) {
          setSelectedRoute(msg.updated_route);
          if (tripPlan) {
            setTripPlan({
              ...tripPlan,
              recommended_route: msg.updated_route,
            });
          }
        }

        if (msg.updated_stations) {
          setNearbyStations(msg.updated_stations);
        }

        // Show Re-plan notification banner
        setReplanBanner({
          show: true,
          title: 'Route Dynamically Re-planned',
          reasons: msg.explanation || [
            'Station condition changed. EVoyage adapted route to avoid queue.',
          ],
          previousStationName: 'Previous Station',
          newStationName: msg.updated_route?.recommended_station?.name || 'New Station',
        });
      }
    });

    return () => {
      unsubscribe();
      wsClient.disconnect();
    };
  }, [tripPlan?.trip_id]);

  // Driving in-transit timer loop
  useEffect(() => {
    if (isTripActive) {
      const totalKm = selectedRoute?.total_distance_km || 55;
      const startSoc = selectedVehicle?.current_soc_percent || 72;
      const targetStationName =
        selectedRoute?.recommended_station?.name || 'Tata Power Fast DC Hub';

      setDriveMetrics((prev) => ({
        ...prev,
        totalDistanceKm: totalKm,
        currentDriveSoc: startSoc,
        currentSpeedKmph: 62,
        nextStopName: targetStationName,
        nextStopDistanceKm: Math.min(22, totalKm * 0.4),
        nextStopEtaMins: 18,
      }));

      driveTimerRef.current = setInterval(() => {
        setDriveMetrics((prev) => {
          const newDistance = Math.min(prev.totalDistanceKm, prev.distanceTraveledKm + 1.2);
          const newElapsed = prev.elapsedTimeMins + 1;
          const drainRate = 0.4;
          const newSoc = Math.max(10, Math.round(prev.currentDriveSoc - drainRate));
          const newDistToStop = Math.max(0, Math.round((prev.nextStopDistanceKm - 1.2) * 10) / 10);
          const newEta = Math.max(0, Math.round(newDistToStop * 0.9));

          return {
            ...prev,
            distanceTraveledKm: Math.round(newDistance * 10) / 10,
            elapsedTimeMins: newElapsed,
            currentDriveSoc: newSoc,
            currentSpeedKmph: Math.floor(58 + Math.random() * 12),
            nextStopDistanceKm: newDistToStop,
            nextStopEtaMins: newEta,
          };
        });
      }, 3000);
    } else {
      if (driveTimerRef.current) {
        clearInterval(driveTimerRef.current);
      }
    }

    return () => {
      if (driveTimerRef.current) clearInterval(driveTimerRef.current);
    };
  }, [isTripActive, selectedRoute?.id]);

  const planRoute = async (mode: string = preferenceMode) => {
    setIsPlanning(true);
    setPreferenceMode(mode);
    try {
      const resp = await tripService.planTrip({
        origin,
        destination,
        corridor_key: corridorKey,
        vehicle_id: selectedVehicle?.id || 'demo-veh-1',
        current_soc_percent: selectedVehicle?.current_soc_percent ?? 72.0,
        battery_capacity_kwh: selectedVehicle?.battery_capacity_kwh ?? 40.5,
        battery_health_percent: selectedVehicle?.battery_health_percent ?? 95.0,
        efficiency_kwh_per_km: selectedVehicle?.average_efficiency_kwh_per_km ?? 0.145,
        temperature_celsius: 32.0,
        preference_mode: mode,
      });

      setTripPlan(resp);
      setSelectedRoute(resp.recommended_route);
      setNearbyStations(resp.nearby_stations);
      setSelectedStation(resp.recommended_route.recommended_station);
    } catch (err) {
      console.warn('Backend planRoute error, using fallback state:', err);
    } finally {
      setIsPlanning(false);
    }
  };

  const startTrip = () => {
    setIsTripActive(true);
    if (tripPlan?.trip_id) {
      tripService.startTrip(tripPlan.trip_id).catch(() => {});
    }
  };

  const stopTrip = async () => {
    setIsTripActive(false);

    const initialSoc = selectedVehicle?.current_soc_percent || 75;
    const finalSoc = driveMetrics.currentDriveSoc || Math.max(15, initialSoc - 35);
    const distanceKm = driveMetrics.distanceTraveledKm > 0 ? driveMetrics.distanceTraveledKm : (selectedRoute?.total_distance_km || 55);
    const durationMins = driveMetrics.elapsedTimeMins > 0 ? driveMetrics.elapsedTimeMins : (selectedRoute?.total_duration_minutes || 50);
    const costInr = selectedRoute?.estimated_cost_inr || 260;

    const completedSummary: Partial<TripHistoryItem> = {
      id: `trip-${Date.now()}`,
      origin: origin,
      destination: destination,
      distance_km: distanceKm,
      duration_minutes: durationMins,
      stops_count: selectedRoute?.stops_count || 1,
      charged_at: selectedRoute?.recommended_station?.name || 'Tata Power Fast DC Hub',
      energy_kwh: Math.round(distanceKm * (selectedVehicle?.average_efficiency_kwh_per_km || 0.145) * 10) / 10,
      cost_inr: costInr,
      initial_soc: initialSoc,
      final_soc: finalSoc,
      status: 'Completed',
    };

    setLastCompletedTrip(completedSummary);
    setIsCompletionModalOpen(true);

    // Update battery in vehicle context
    updateSOC(finalSoc);

    // Save trip to Supabase
    try {
      await supabaseService.saveTrip(completedSummary, userProfile?.id, selectedVehicle?.id);
    } catch (err) {
      console.warn('Could not sync completed trip to Supabase:', err);
    }
  };

  const dismissReplanBanner = () => {
    setReplanBanner(null);
  };

  return (
    <TripContext.Provider
      value={{
        origin,
        destination,
        corridorKey,
        setCorridorKey,
        setOrigin,
        setDestination,
        preferenceMode,
        setPreferenceMode,
        tripPlan,
        selectedRoute,
        setSelectedRoute,
        nearbyStations,
        setNearbyStations,
        isTripActive,
        isPlanning,
        planRoute,
        startTrip,
        stopTrip,
        driveMetrics,
        lastCompletedTrip,
        isCompletionModalOpen,
        setIsCompletionModalOpen,
        replanBanner,
        dismissReplanBanner,
        selectedStation,
        setSelectedStation,
      }}
    >
      {children}
    </TripContext.Provider>
  );
};

export const useTrip = () => {
  const context = useContext(TripContext);
  if (!context) throw new Error('useTrip must be used within TripProvider');
  return context;
};
