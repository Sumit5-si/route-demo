import React from 'react';
import { useTrip } from '../../context/TripContext';
import { useVehicle } from '../../context/VehicleContext';
import {
  Play,
  Navigation,
  Zap,
  Clock,
  ShieldCheck,
  MapPin,
  Car,
  CloudSun,
  Layers,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Activity
} from 'lucide-react';

export const PreTripOverview: React.FC = () => {
  const {
    origin,
    destination,
    selectedRoute,
    startTrip,
    isPlanning,
    nearbyStations
  } = useTrip();

  const { selectedVehicle } = useVehicle();

  const soc = selectedVehicle?.current_soc_percent ?? 72;
  const batteryHealth = selectedVehicle?.battery_health_percent ?? 95;
  const distanceKm = selectedRoute?.total_distance_km || 55;
  const durationMins = selectedRoute?.total_duration_minutes || 50;
  const targetStation = selectedRoute?.recommended_station || nearbyStations[0];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-7 shadow-sm space-y-6 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="flex items-start justify-between pb-4 border-b border-slate-100">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-teal-50 text-teal-700 border border-teal-200">
              Trip Plan Ready
            </span>
            <span className="text-xs font-semibold text-slate-400">
              Pre-Flight Checklist & Route Telemetry
            </span>
          </div>
          <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">
            Journey Overview & Vehicle Readiness
          </h2>
        </div>

        <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center shrink-0 shadow-sm">
          <Navigation className="w-5 h-5 text-teal-400" />
        </div>
      </div>

      {/* Main Corridor Banner */}
      <div className="p-4 bg-slate-50/80 border border-slate-200/80 rounded-2xl space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
            Corridor Route
          </span>
          <span className="text-xs font-extrabold text-teal-700 bg-white px-2.5 py-0.5 rounded-full border border-slate-200">
            {distanceKm} km · {Math.floor(durationMins / 60) > 0 ? `${Math.floor(durationMins / 60)}h ` : ''}{durationMins % 60}m
          </span>
        </div>

        <div className="flex items-center gap-3 text-sm font-black text-slate-900">
          <div className="flex items-center gap-1.5 truncate">
            <div className="w-2.5 h-2.5 rounded-full bg-slate-900 shrink-0" />
            <span className="truncate">{origin}</span>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
          <div className="flex items-center gap-1.5 truncate">
            <div className="w-2.5 h-2.5 rounded-full bg-teal-500 shrink-0" />
            <span className="truncate">{destination}</span>
          </div>
        </div>
      </div>

      {/* Grid of Key Pre-Drive Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {/* Selected Vehicle Tile */}
        <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl">
          <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
            <Car className="w-3.5 h-3.5 text-slate-600" /> Active Car
          </span>
          <p className="text-xs font-black text-slate-900 mt-1 truncate">
            {selectedVehicle?.model || 'Nexon EV Max'}
          </p>
          <p className="text-[10px] text-slate-500 font-medium mt-0.5">
            {selectedVehicle?.battery_capacity_kwh || 40.5} kWh pack
          </p>
        </div>

        {/* Battery Health & Usable Tile */}
        <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl">
          <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Battery Health
          </span>
          <p className="text-xs font-black text-emerald-700 mt-1">
            {batteryHealth}% SOH
          </p>
          <p className="text-[10px] text-slate-500 font-medium mt-0.5">
            Usable: {((parseFloat(`${selectedVehicle?.battery_capacity_kwh || 40.5}`) * batteryHealth) / 100).toFixed(1)} kWh
          </p>
        </div>

        {/* Start Battery SOC Tile */}
        <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl">
          <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-teal-600" /> Start SOC
          </span>
          <p className="text-xs font-black text-slate-900 mt-1">
            {Math.round(soc)}%
          </p>
          <p className="text-[10px] text-slate-500 font-medium mt-0.5">
            Arrival target: ~{Math.round(selectedRoute?.estimated_arrival_soc || 28)}%
          </p>
        </div>

        {/* Recommended Charger Bay Tile */}
        <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl">
          <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-sky-500" /> Target Charger
          </span>
          <p className="text-xs font-black text-slate-900 mt-1 truncate">
            {targetStation?.name?.split('-')[0] || 'Tata Power Hub'}
          </p>
          <p className="text-[10px] text-slate-500 font-medium mt-0.5">
            {targetStation?.charging_power_kw || 60} kW DC · Bay Ready
          </p>
        </div>

        {/* Weather & Temperature */}
        <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl">
          <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
            <CloudSun className="w-3.5 h-3.5 text-amber-500" /> Weather & AC
          </span>
          <p className="text-xs font-black text-slate-900 mt-1">
            32°C · Clear
          </p>
          <p className="text-[10px] text-slate-500 font-medium mt-0.5">
            AC drain factored in
          </p>
        </div>

        {/* Elevation Profile & Road Grade */}
        <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl">
          <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-slate-600" /> Elevation
          </span>
          <p className="text-xs font-black text-slate-900 mt-1">
            +38m / -110m
          </p>
          <p className="text-[10px] text-slate-500 font-medium mt-0.5">
            Regen braking active
          </p>
        </div>
      </div>

      {/* Real-time Map Launch Notice Box */}
      <div className="p-4 bg-teal-50/70 border border-teal-200 rounded-2xl flex items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-teal-500 animate-ping" />
            <h3 className="text-xs font-bold text-slate-900">
              Interactive Google Map With Real-Time Traffic & GPS
            </h3>
          </div>
          <p className="text-[11px] text-slate-600 leading-relaxed">
            When you click <strong>Start Journey</strong>, the live interactive Google Map will load right here with real-time traffic flow, active vehicle GPS tracking, and reserved charging station bays.
          </p>
        </div>
      </div>

      {/* Primary Action Button: Start Journey & Open Live Map */}
      <button
        onClick={startTrip}
        disabled={isPlanning}
        className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 active:scale-[0.99] text-white text-sm font-extrabold rounded-2xl shadow-md transition-all flex items-center justify-center gap-2.5 cursor-pointer group"
      >
        <div className="w-6 h-6 rounded-full bg-teal-500 text-white flex items-center justify-center group-hover:scale-110 transition-transform">
          <Play className="w-3.5 h-3.5 fill-white" />
        </div>
        <span>Start Journey & Launch Real-Time Google Map</span>
      </button>
    </div>
  );
};
