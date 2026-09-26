import React from 'react';
import { useVehicle } from '../../context/VehicleContext';
import { useTrip } from '../../context/TripContext';

export const BatteryCard: React.FC = () => {
  const { selectedVehicle, updateSOC } = useVehicle();
  const { tripPlan } = useTrip();

  const soc = selectedVehicle?.current_soc_percent ?? 72;
  const health = selectedVehicle?.battery_health_percent ?? 95;
  const rangeKm = tripPlan?.estimated_range_km ?? Math.round(soc * 2.33);
  const efficiency = selectedVehicle?.average_efficiency_kwh_per_km ?? 0.145;
  const kmPerKwh = (1.0 / efficiency).toFixed(1);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-sm">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
          BATTERY
        </span>
        <span className="px-2.5 py-0.5 text-[11px] font-semibold text-emerald-600 bg-emerald-50 rounded-full border border-emerald-200">
          {health >= 85 ? 'Healthy' : `${health}% SOH`}
        </span>
      </div>

      {/* Main SOC & Range Line */}
      <div className="flex items-baseline gap-2 mb-3">
        <span className="text-3xl font-black text-slate-900 tracking-tight">
          {Math.round(soc)}%
        </span>
        <span className="text-xs font-medium text-slate-500">
          · {rangeKm} km range left
        </span>
      </div>

      {/* Progress Bar with 0%, 50%, 100% Labels */}
      <div className="mb-4">
        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden relative border border-slate-200/40">
          <div
            className="h-full bg-slate-900 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, Math.max(5, soc))}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] font-semibold text-slate-400 mt-1 px-0.5">
          <span>0%</span>
          <span>50%</span>
          <span>100%</span>
        </div>
      </div>

      {/* 3 Metric Tiles matching UI Mockup */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="bg-slate-50/80 border border-slate-200/70 rounded-xl p-2.5 text-center">
          <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
            AVG
          </div>
          <div className="text-xs font-black text-slate-900 mt-0.5">
            {kmPerKwh} km/kWh
          </div>
        </div>

        <div className="bg-slate-50/80 border border-slate-200/70 rounded-xl p-2.5 text-center">
          <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
            TEMP
          </div>
          <div className="text-xs font-black text-slate-900 mt-0.5">
            32°C · OK
          </div>
        </div>

        <div className="bg-slate-50/80 border border-slate-200/70 rounded-xl p-2.5 text-center">
          <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
            MODE
          </div>
          <div className="text-xs font-black text-slate-900 mt-0.5">
            Normal
          </div>
        </div>
      </div>
    </div>
  );
};
