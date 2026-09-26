import React from 'react';
import { useTrip } from '../../context/TripContext';
import { RouteAlternative } from '../../types/trip';
import { Navigation, Zap, ShieldCheck } from 'lucide-react';

export const RouteComparison: React.FC = () => {
  const { tripPlan, selectedRoute, setSelectedRoute } = useTrip();

  if (!tripPlan || !tripPlan.alternatives || tripPlan.alternatives.length === 0) {
    return null;
  }

  const formatDuration = (mins: number) => {
    const hours = Math.floor(mins / 60);
    const m = mins % 60;
    if (hours > 0) {
      return `${hours}h ${m > 0 ? `${m}m` : ''}`;
    }
    return `${m}m`;
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-black uppercase tracking-wider text-slate-900">Dynamic Routes</h2>
        <span className="text-[11px] text-slate-400 font-medium">Based on current charge</span>
      </div>

      <div className="space-y-2.5">
        {tripPlan.alternatives.map((alt: RouteAlternative) => {
          const isSelected = selectedRoute?.id === alt.id;

          return (
            <div
              key={alt.id}
              onClick={() => setSelectedRoute(alt)}
              className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                isSelected
                  ? 'border-[#0F172A] bg-slate-50/70 ring-1 ring-[#0F172A] shadow-sm'
                  : 'border-slate-200/80 hover:border-slate-300 bg-white'
              }`}
            >
              {/* Header: Title & Badges */}
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900">{alt.name}</span>
                  {alt.badge && (
                    <span
                      className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        isSelected
                          ? 'bg-[#0F172A] text-white'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {alt.badge}
                    </span>
                  )}
                </div>

                <span className="text-xs font-black text-slate-900">
                  {formatDuration(alt.total_duration_minutes)}
                </span>
              </div>

              {/* Specs Line */}
              <div className="flex items-center flex-wrap gap-x-2.5 gap-y-1 text-[11px] text-slate-600 font-medium">
                <span className="flex items-center gap-1">
                  <Navigation className="w-3 h-3 text-[#0EA5E9]" />
                  {alt.total_distance_km} km
                </span>

                <span className="text-slate-300">•</span>

                <span className="flex items-center gap-1">
                  <Zap className="w-3 h-3 text-teal-600" />
                  {alt.stops_count} stop ({alt.charging_duration_minutes}m charge)
                </span>

                <span className="text-slate-300">•</span>

                <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  Arrive with {Math.round(alt.estimated_arrival_soc)}%
                </span>
              </div>

              {/* Station Info snippet */}
              <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
                <span>
                  Via <strong className="text-slate-700 font-semibold">{alt.recommended_station.name}</strong>
                </span>
                <span className="font-bold text-slate-700">₹{alt.estimated_cost_inr}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
