import React from 'react';
import { ChargingStation } from '../../types/station';
import { Zap, Clock, Users, IndianRupee, ShieldCheck, MapPin, X } from 'lucide-react';

interface StationPopupProps {
  station: ChargingStation | null;
  isRecommended?: boolean;
  onClose: () => void;
}

export const StationPopup: React.FC<StationPopupProps> = ({ station, isRecommended, onClose }) => {
  if (!station) return null;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return (
          <span className="px-2 py-0.5 rounded-pill text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            Available
          </span>
        );
      case 'BUSY':
        return (
          <span className="px-2 py-0.5 rounded-pill text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            High Queue
          </span>
        );
      case 'OFFLINE':
        return (
          <span className="px-2 py-0.5 rounded-pill text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            Offline
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="absolute bottom-5 left-5 right-5 sm:left-auto sm:right-5 sm:w-96 bg-white/95 backdrop-blur-md rounded-card border border-border p-4 shadow-evoyage-lg z-30 animate-in fade-in slide-in-from-bottom-3 duration-200">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900 leading-tight">{station.name}</h3>
            {isRecommended && (
              <span className="px-2 py-0.5 rounded-pill text-[10px] font-extrabold bg-teal-500 text-white shadow-sm">
                Recommended
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
            <span className="truncate">{station.address}</span>
          </p>
          <div className="mt-1 flex items-center gap-1.5 text-[10px] font-mono text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200/60 inline-flex">
            <span>📍 {station.latitude.toFixed(6)}, {station.longitude.toFixed(6)}</span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Badges and Specs Grid */}
      <div className="grid grid-cols-2 gap-2 my-3">
        <div className="bg-slate-50 p-2.5 rounded-card border border-slate-100">
          <span className="text-[10px] uppercase font-bold text-slate-400">Power & Connector</span>
          <div className="flex items-center gap-1.5 mt-0.5 font-bold text-xs text-slate-800">
            <Zap className="w-3.5 h-3.5 text-sky-500 fill-sky-500" />
            <span>{station.charging_power_kw} kW</span>
            <span className="text-slate-400">({station.connector_type})</span>
          </div>
        </div>

        <div className="bg-slate-50 p-2.5 rounded-card border border-slate-100">
          <span className="text-[10px] uppercase font-bold text-slate-400">Availability</span>
          <div className="flex items-center justify-between mt-0.5">
            <span className="text-xs font-bold text-slate-800">
              {station.available_connectors} / {station.total_connectors} free
            </span>
            {getStatusBadge(station.status)}
          </div>
        </div>

        <div className="bg-slate-50 p-2.5 rounded-card border border-slate-100">
          <span className="text-[10px] uppercase font-bold text-slate-400">Estimated Wait</span>
          <div className="flex items-center gap-1.5 mt-0.5 font-bold text-xs text-slate-800">
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            <span>{station.estimated_wait_minutes} min wait</span>
          </div>
        </div>

        <div className="bg-slate-50 p-2.5 rounded-card border border-slate-100">
          <span className="text-[10px] uppercase font-bold text-slate-400">Rate</span>
          <div className="flex items-center gap-1 mt-0.5 font-bold text-xs text-slate-800">
            <IndianRupee className="w-3.5 h-3.5 text-slate-600" />
            <span>{station.price_per_kwh} / kWh</span>
          </div>
        </div>
      </div>

      {/* Amenities */}
      {station.amenities && (
        <div className="flex flex-wrap gap-1 pt-1">
          {station.amenities.map((a, i) => (
            <span key={i} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-pill">
              {a}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
