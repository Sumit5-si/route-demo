import React from 'react';
import { useTrip } from '../../context/TripContext';
import { AlertTriangle, RefreshCw, X, ArrowRight, ShieldAlert } from 'lucide-react';

export const DynamicReplanBanner: React.FC = () => {
  const { replanBanner, dismissReplanBanner, selectedRoute } = useTrip();

  if (!replanBanner || !replanBanner.show) {
    return null;
  }

  return (
    <div className="bg-amber-50/95 border border-amber-200 rounded-card p-4 shadow-evoyage-md mb-4 animate-in fade-in slide-in-from-top-3 duration-300">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-amber-100 rounded-pill text-amber-700 flex-shrink-0 mt-0.5">
            <RefreshCw className="w-4 h-4 animate-spin" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-amber-900">
                Route Dynamically Re-planned
              </h3>
              <span className="text-[10px] uppercase tracking-wider font-extrabold bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded">
                Live Re-route
              </span>
            </div>

            <p className="text-xs text-amber-800 mt-1 font-medium">
              Station conditions changed. EVoyage adapted your route & charging stop in real-time.
            </p>

            {/* Explanations */}
            <div className="mt-2.5 space-y-1 bg-white/70 p-2.5 rounded-lg border border-amber-200/60">
              {replanBanner.reasons.map((r, i) => (
                <div key={i} className="text-xs text-slate-800 font-medium flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0" />
                  <span>{r}</span>
                </div>
              ))}
            </div>

            <div className="mt-2.5 flex items-center gap-2 text-xs font-semibold text-teal-800">
              <span>New Stop:</span>
              <strong className="text-teal-900 font-bold underline decoration-teal-500">
                {selectedRoute?.recommended_station?.name}
              </strong>
            </div>
          </div>
        </div>

        <button
          onClick={dismissReplanBanner}
          className="text-amber-700 hover:text-amber-900 p-1 rounded-full hover:bg-amber-100 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
