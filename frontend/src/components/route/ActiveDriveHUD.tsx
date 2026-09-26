import React from 'react';
import { useTrip } from '../../context/TripContext';
import { useVehicle } from '../../context/VehicleContext';
import {
  Navigation,
  Square,
  Zap,
  Clock,
  Gauge,
  MapPin,
  ShieldCheck,
  AlertTriangle,
  Radio
} from 'lucide-react';

export const ActiveDriveHUD: React.FC = () => {
  const { driveMetrics, stopTrip, selectedRoute, origin, destination } = useTrip();
  const { selectedVehicle } = useVehicle();

  const progressPercent = Math.min(
    100,
    Math.round((driveMetrics.distanceTraveledKm / (driveMetrics.totalDistanceKm || 1)) * 100)
  );

  return (
    <div className="bg-white rounded-2xl border-2 border-[#14B8A6]/40 p-5 shadow-lg relative overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
      {/* Top Pulse Glow */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-teal-400 via-sky-500 to-teal-500 animate-pulse" />

      {/* Header Bar */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-teal-500" />
          </span>
          <span className="text-xs font-black uppercase tracking-wider text-slate-900">
            Active Journey in Progress
          </span>
        </div>

        {/* END DRIVE BUTTON */}
        <button
          onClick={stopTrip}
          title="End your drive session at any time"
          className="px-4 py-2 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs font-extrabold rounded-full shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <Square className="w-3.5 h-3.5 fill-white" />
          <span>End Drive Now</span>
        </button>
      </div>

      {/* Route Title */}
      <div className="mt-3 flex items-center justify-between text-xs text-slate-700 font-bold">
        <div className="flex items-center gap-1.5 truncate">
          <MapPin className="w-3.5 h-3.5 text-slate-400" />
          <span>{origin}</span>
          <span className="text-slate-400 font-normal">→</span>
          <span>{destination}</span>
        </div>
        <span className="text-[11px] text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
          {selectedVehicle?.model || 'EV'}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="mt-3">
        <div className="flex justify-between text-[11px] font-bold text-slate-500 mb-1">
          <span>{driveMetrics.distanceTraveledKm} km covered</span>
          <span>{Math.max(0, Math.round((driveMetrics.totalDistanceKm - driveMetrics.distanceTraveledKm) * 10) / 10)} km remaining</span>
        </div>
        <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200">
          <div
            className="h-full bg-gradient-to-r from-teal-500 to-sky-500 rounded-full transition-all duration-700"
            style={{ width: `${Math.max(4, progressPercent)}%` }}
          />
        </div>
      </div>

      {/* Real-Time Driving HUD Tiles */}
      <div className="grid grid-cols-3 gap-2.5 mt-4">
        {/* Speed */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-center">
          <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center justify-center gap-1">
            <Gauge className="w-3 h-3 text-slate-500" /> Speed
          </span>
          <p className="text-base font-black text-slate-900 mt-0.5">
            {driveMetrics.currentSpeedKmph} <span className="text-[10px] font-normal text-slate-500">km/h</span>
          </p>
        </div>

        {/* Live Battery SOC */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-center">
          <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center justify-center gap-1">
            <Zap className="w-3 h-3 text-teal-600" /> Live Battery
          </span>
          <p className="text-base font-black text-teal-700 mt-0.5">
            {Math.round(driveMetrics.currentDriveSoc)}%
          </p>
        </div>

        {/* Drive Time */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-center">
          <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center justify-center gap-1">
            <Clock className="w-3 h-3 text-amber-500" /> Elapsed
          </span>
          <p className="text-base font-black text-slate-900 mt-0.5">
            {driveMetrics.elapsedTimeMins} <span className="text-[10px] font-normal text-slate-500">mins</span>
          </p>
        </div>
      </div>

      {/* Target Charging Stop Banner */}
      <div className="mt-3.5 p-2.5 bg-sky-50/70 border border-sky-200 rounded-xl flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-sky-500 text-white flex items-center justify-center">
            <Zap className="w-3.5 h-3.5 fill-white" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-900 leading-tight">
              Target Stop: {driveMetrics.nextStopName}
            </p>
            <p className="text-[11px] text-slate-500">
              Reserved Bay • Expected in {driveMetrics.nextStopDistanceKm} km (~{driveMetrics.nextStopEtaMins} min)
            </p>
          </div>
        </div>
        <span className="text-[11px] font-extrabold text-sky-700 bg-white border border-sky-200 px-2 py-0.5 rounded-full shadow-xs">
          Bay Ready
        </span>
      </div>
    </div>
  );
};
