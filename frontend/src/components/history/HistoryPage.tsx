import React, { useState, useEffect } from 'react';
import { TripHistoryItem } from '../../types/trip';
import { tripService } from '../../services/tripService';
import { supabaseService } from '../../services/supabaseService';
import { useVehicle } from '../../context/VehicleContext';
import { Navigation, Clock, Zap, IndianRupee, RefreshCw, CheckCircle2, MapPin, Database } from 'lucide-react';

export const HistoryPage: React.FC = () => {
  const { userProfile } = useVehicle();
  const [history, setHistory] = useState<TripHistoryItem[]>([]);
  const [isDbLoaded, setIsDbLoaded] = useState(false);

  useEffect(() => {
    const loadHistory = async () => {
      // 1. Try Supabase
      const dbTrips = await supabaseService.getTripHistory(userProfile?.id);
      if (dbTrips && dbTrips.length > 0) {
        setHistory(dbTrips);
        setIsDbLoaded(true);
        return;
      }

      // 2. Fallback to trip service
      try {
        const localData = await tripService.getHistory();
        if (localData && localData.length > 0) {
          setHistory(localData);
        }
      } catch {
        setHistory([]);
      }
    };
    loadHistory();
  }, [userProfile?.id]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="bg-card rounded-card border border-border p-5 sm:p-6 shadow-evoyage">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-primary tracking-tight">
              Journey & Charging History
            </h1>
            <p className="text-xs sm:text-sm text-secondary mt-1">
              Review completed EV journeys, actual energy consumed, charging stops, and dynamic adaptations.
            </p>
          </div>
          {isDbLoaded && (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-teal-50 border border-teal-200 rounded-full text-xs font-bold text-teal-700 self-start sm:self-auto">
              <Database className="w-3.5 h-3.5" />
              <span>Synced with Supabase</span>
            </div>
          )}
        </div>
      </div>

      {/* History List */}
      <div className="space-y-3">
        {history.map((item) => (
          <div
            key={item.id}
            className="bg-card rounded-card border border-border p-5 shadow-evoyage hover:shadow-evoyage-md transition-all"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-pill border border-teal-200">
                    {item.date}
                  </span>
                  <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Completed
                  </span>
                </div>
                <h3 className="text-base font-extrabold text-slate-900 mt-1.5 flex items-center gap-2">
                  <span>{item.origin}</span>
                  <span className="text-slate-400 font-normal">→</span>
                  <span>{item.destination}</span>
                </h3>
              </div>

              <div className="text-right flex sm:flex-col justify-between items-center sm:items-end">
                <span className="text-xs text-slate-400 font-medium">Total Cost</span>
                <span className="text-lg font-extrabold text-slate-900">₹{item.cost_inr}</span>
              </div>
            </div>

            {/* Metrics Ribbon */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-3 border-t border-slate-100 text-xs">
              <div className="bg-slate-50 p-2.5 rounded-card">
                <span className="text-[10px] uppercase font-bold text-slate-400">Distance</span>
                <p className="font-bold text-slate-800 mt-0.5">{item.distance_km} km</p>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-card">
                <span className="text-[10px] uppercase font-bold text-slate-400">Travel Time</span>
                <p className="font-bold text-slate-800 mt-0.5">{item.duration_minutes} mins</p>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-card">
                <span className="text-[10px] uppercase font-bold text-slate-400">Charging Stop</span>
                <p className="font-bold text-teal-700 mt-0.5 truncate">{item.charged_at}</p>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-card">
                <span className="text-[10px] uppercase font-bold text-slate-400">Energy Charged</span>
                <p className="font-bold text-slate-800 mt-0.5">{item.energy_kwh} kWh</p>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-card">
                <span className="text-[10px] uppercase font-bold text-slate-400">Final SOC</span>
                <p className="font-bold text-emerald-600 mt-0.5">{item.final_soc}%</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
