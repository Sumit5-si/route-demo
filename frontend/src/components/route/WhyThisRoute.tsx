import React from 'react';
import { useTrip } from '../../context/TripContext';
import { CheckCircle2, Info, Lightbulb } from 'lucide-react';

export const WhyThisRoute: React.FC = () => {
  const { selectedRoute } = useTrip();

  if (!selectedRoute || !selectedRoute.why_recommended) {
    return null;
  }

  return (
    <div className="bg-card rounded-card border border-border p-4 sm:p-5 shadow-evoyage">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-5 h-5 rounded-full bg-teal-50 flex items-center justify-center text-teal-600">
          <Lightbulb className="w-3.5 h-3.5" />
        </div>
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
          Why EVoyage Recommended This Plan
        </h2>
      </div>

      <div className="space-y-2">
        {selectedRoute.why_recommended.map((reason, idx) => (
          <div key={idx} className="flex items-start gap-2 text-xs text-slate-700 font-medium leading-relaxed">
            <CheckCircle2 className="w-4 h-4 text-teal-600 flex-shrink-0 mt-0.5" />
            <span>{reason}</span>
          </div>
        ))}
      </div>

      <div className="mt-3 pt-2.5 border-t border-border/60 flex items-center justify-between text-[11px] text-slate-400">
        <span>Scored by Transparent Multi-Factor Decision Engine</span>
        <span className="text-teal-600 font-semibold">100% Explainable</span>
      </div>
    </div>
  );
};
