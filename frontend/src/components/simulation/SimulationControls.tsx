import React from 'react';
import { useDemo } from '../../context/DemoContext';
import { useTrip } from '../../context/TripContext';
import { Play, Square, AlertOctagon, Flame, Clock, BatteryLow, RotateCcw, Sparkles } from 'lucide-react';

export const SimulationControls: React.FC = () => {
  const { triggerEvent, isSimulating, activeSimulationEvent, eventLogs } = useDemo();
  const { isTripActive, startTrip, stopTrip, selectedRoute } = useTrip();

  return (
    <div className="bg-card rounded-card border border-border p-4 sm:p-5 shadow-evoyage">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-teal-50 flex items-center justify-center text-teal-600">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Hackathon Live Simulator
          </h2>
        </div>

        {/* Start / Stop Trip Button */}
        <button
          onClick={isTripActive ? stopTrip : startTrip}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-pill text-xs font-bold shadow-sm transition-all ${
            isTripActive
              ? 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
              : 'bg-emerald-600 hover:bg-emerald-700 text-white'
          }`}
        >
          {isTripActive ? (
            <>
              <Square className="w-3 h-3 fill-current" />
              <span>End Journey</span>
            </>
          ) : (
            <>
              <Play className="w-3 h-3 fill-current" />
              <span>Start Journey</span>
            </>
          )}
        </button>
      </div>

      <p className="text-xs text-slate-500 mb-3 font-medium">
        Inject real-time corridor disruptions to demonstrate EVoyage's dynamic re-planning intelligence:
      </p>

      {/* Disruption Trigger Buttons */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => triggerEvent('STATION_CONGESTION')}
          disabled={isSimulating}
          className={`p-2.5 rounded-card border text-left transition-all ${
            activeSimulationEvent === 'STATION_CONGESTION'
              ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-300/30'
              : 'bg-slate-50 border-border hover:bg-slate-100'
          }`}
        >
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800">
            <Flame className="w-3.5 h-3.5 text-amber-600" />
            <span>Queue Spike</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Wait increases 8m → 42m</p>
        </button>

        <button
          onClick={() => triggerEvent('STATION_OFFLINE')}
          disabled={isSimulating}
          className={`p-2.5 rounded-card border text-left transition-all ${
            activeSimulationEvent === 'STATION_OFFLINE'
              ? 'bg-rose-50 border-rose-300 ring-2 ring-rose-300/30'
              : 'bg-slate-50 border-border hover:bg-slate-100'
          }`}
        >
          <div className="flex items-center gap-1.5 text-xs font-bold text-rose-800">
            <AlertOctagon className="w-3.5 h-3.5 text-rose-600" />
            <span>Station Offline</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Grid outage at target stop</p>
        </button>

        <button
          onClick={() => triggerEvent('SOC_DROP_RAPID')}
          disabled={isSimulating}
          className={`p-2.5 rounded-card border text-left transition-all ${
            activeSimulationEvent === 'SOC_DROP_RAPID'
              ? 'bg-teal-50 border-teal-300 ring-2 ring-teal-300/30'
              : 'bg-slate-50 border-border hover:bg-slate-100'
          }`}
        >
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
            <BatteryLow className="w-3.5 h-3.5 text-slate-600" />
            <span>SOC Drop (-15%)</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Unexpected AC drain</p>
        </button>

        <button
          onClick={() => triggerEvent('TRAFFIC_DELAY')}
          disabled={isSimulating}
          className={`p-2.5 rounded-card border text-left transition-all ${
            activeSimulationEvent === 'TRAFFIC_DELAY'
              ? 'bg-sky-50 border-sky-300 ring-2 ring-sky-300/30'
              : 'bg-slate-50 border-border hover:bg-slate-100'
          }`}
        >
          <div className="flex items-center gap-1.5 text-xs font-bold text-sky-800">
            <Clock className="w-3.5 h-3.5 text-sky-600" />
            <span>Traffic +25 min</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Highway bottleneck</p>
        </button>
      </div>

      {/* Reset Button */}
      <div className="mt-2.5 pt-2.5 border-t border-border flex items-center justify-between">
        <span className="text-[11px] text-slate-400 font-medium">Clear live triggers</span>
        <button
          onClick={() => triggerEvent('RESET_NORMAL')}
          className="flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-teal-600 transition-colors"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset All Stations</span>
        </button>
      </div>
    </div>
  );
};
