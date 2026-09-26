import React from 'react';
import { useTrip } from '../../context/TripContext';
import { useVehicle } from '../../context/VehicleContext';
import {
  CheckCircle2,
  Navigation,
  Clock,
  Zap,
  IndianRupee,
  ShieldCheck,
  X,
  Database,
  ArrowRight
} from 'lucide-react';
import { Logo } from '../common/Logo';

export const TripCompletionModal: React.FC = () => {
  const { isCompletionModalOpen, setIsCompletionModalOpen, lastCompletedTrip } = useTrip();
  const { selectedVehicle } = useVehicle();

  if (!isCompletionModalOpen || !lastCompletedTrip) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-md p-6 shadow-2xl relative animate-in zoom-in-95 duration-200">
        {/* Top Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Journey Concluded</h2>
              <p className="text-xs text-slate-500">Trip summary & battery report</p>
            </div>
          </div>

          <button
            onClick={() => setIsCompletionModalOpen(false)}
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Route Banner */}
        <div className="my-4 p-3 bg-slate-50 border border-slate-200 rounded-xl">
          <div className="flex items-center justify-between text-xs font-bold text-slate-900">
            <span>{lastCompletedTrip.origin}</span>
            <span className="text-slate-400">→</span>
            <span>{lastCompletedTrip.destination}</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Driven in: <strong className="text-slate-700">{selectedVehicle?.manufacturer} {selectedVehicle?.model}</strong>
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-2.5 mb-4">
          <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
            <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
              <Navigation className="w-3 h-3 text-[#0EA5E9]" /> Distance
            </span>
            <p className="text-sm font-extrabold text-slate-900 mt-0.5">
              {lastCompletedTrip.distance_km} km
            </p>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
            <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
              <Clock className="w-3 h-3 text-amber-500" /> Total Time
            </span>
            <p className="text-sm font-extrabold text-slate-900 mt-0.5">
              {lastCompletedTrip.duration_minutes} mins
            </p>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
            <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
              <Zap className="w-3 h-3 text-[#14B8A6]" /> Energy
            </span>
            <p className="text-sm font-extrabold text-slate-900 mt-0.5">
              {lastCompletedTrip.energy_kwh} kWh
            </p>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
            <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
              <IndianRupee className="w-3 h-3 text-slate-600" /> Est. Cost
            </span>
            <p className="text-sm font-extrabold text-slate-900 mt-0.5">
              ₹{lastCompletedTrip.cost_inr}
            </p>
          </div>
        </div>

        {/* Battery SOC Transition Ribbon */}
        <div className="p-3 bg-teal-50/70 border border-teal-200/80 rounded-xl flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-teal-600" />
            <div>
              <p className="text-xs font-bold text-slate-900">Battery Status</p>
              <p className="text-[11px] text-slate-500">
                {lastCompletedTrip.initial_soc}% start → <span className="font-bold text-teal-700">{lastCompletedTrip.final_soc}% end</span>
              </p>
            </div>
          </div>
          <span className="px-2 py-0.5 bg-white border border-teal-300 rounded-full text-[11px] font-extrabold text-teal-700">
            Within Safe Buffer
          </span>
        </div>

        {/* Supabase Saved Confirmation */}
        <div className="flex items-center justify-between text-[11px] text-slate-400 mb-4 px-1">
          <span className="flex items-center gap-1">
            <Database className="w-3 h-3 text-teal-500" /> Logged to Supabase DB
          </span>
          <span className="text-slate-500">Viewable in History Tab</span>
        </div>

        {/* Close / Return Button */}
        <button
          onClick={() => setIsCompletionModalOpen(false)}
          className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center justify-center gap-2"
        >
          <span>Plan Next Journey</span>
          <ArrowRight className="w-4 h-4 text-teal-400" />
        </button>
      </div>
    </div>
  );
};
