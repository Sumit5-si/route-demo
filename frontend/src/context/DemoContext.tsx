import React, { createContext, useContext, useState } from 'react';
import { EventType } from '../types/simulation';
import { simulationService } from '../services/tripService';
import { useTrip } from './TripContext';

interface DemoContextType {
  demoMode: boolean;
  setDemoMode: (val: boolean) => void;
  isSimulating: boolean;
  activeSimulationEvent: string | null;
  triggerEvent: (eventType: EventType, stationId?: string) => Promise<void>;
  eventLogs: Array<{ time: string; text: string; type: string }>;
}

const DemoContext = createContext<DemoContextType | undefined>(undefined);

export const DemoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { tripPlan, nearbyStations } = useTrip();
  const [demoMode, setDemoMode] = useState(true);
  const [isSimulating, setIsSimulating] = useState(false);
  const [activeSimulationEvent, setActiveSimulationEvent] = useState<string | null>(null);
  const [eventLogs, setEventLogs] = useState<Array<{ time: string; text: string; type: string }>>([
    { time: '09:20:00', text: 'System initialized in Hackathon Offline-First Demo Mode.', type: 'info' }
  ]);

  const triggerEvent = async (eventType: EventType, stationId?: string) => {
    setIsSimulating(true);
    setActiveSimulationEvent(eventType);
    
    // Choose target station
    const targetStationId = stationId || (nearbyStations.length > 0 ? nearbyStations[0].id : 'indore-st-1');

    try {
      const resp = await simulationService.triggerEvent({
        trip_id: tripPlan?.trip_id,
        event_type: eventType,
        station_id: targetStationId,
        target_wait_minutes: 42,
        traffic_delay_minutes: 25,
        soc_drop_percent: 15.0,
      });

      const now = new Date().toLocaleTimeString();
      setEventLogs((prev) => [
        { time: now, text: resp.message, type: eventType },
        ...prev.slice(0, 15),
      ]);
    } catch (e) {
      console.warn('Simulation trigger error:', e);
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <DemoContext.Provider
      value={{
        demoMode,
        setDemoMode,
        isSimulating,
        activeSimulationEvent,
        triggerEvent,
        eventLogs,
      }}
    >
      {children}
    </DemoContext.Provider>
  );
};

export const useDemo = () => {
  const context = useContext(DemoContext);
  if (!context) throw new Error('useDemo must be used within DemoProvider');
  return context;
};
