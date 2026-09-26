import React, { useState, useEffect } from 'react';
import { MultiEVSimulationResult } from '../../types/multi_ev';
import { simulationService } from '../../services/tripService';
import { BatteryIndicator } from '../common/BatteryIndicator';
import {
  Navigation,
  Zap,
  TrendingDown,
  ShieldCheck,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Car,
  Layers,
  ArrowRight,
} from 'lucide-react';

export const MultiEVDashboard: React.FC = () => {
  const [corridor, setCorridor] = useState('INDORE_UJJAIN');
  const [simulationData, setSimulationData] = useState<MultiEVSimulationResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [viewMode, setViewMode] = useState<'AFTER' | 'BEFORE'>('AFTER');

  const fetchSimulation = async (corr: string) => {
    setIsRunning(true);
    try {
      const res = await simulationService.getMultiEVSimulation(corr);
      setSimulationData(res);
    } catch (e) {
      console.warn('Error fetching multi-EV simulation:', e);
    } finally {
      setIsRunning(false);
    }
  };

  useEffect(() => {
    fetchSimulation(corridor);
  }, [corridor]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Banner */}
      <div className="bg-card rounded-card border border-border p-5 sm:p-6 shadow-evoyage">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-extrabold uppercase tracking-wider bg-teal-50 text-teal-700 px-2.5 py-0.5 rounded-pill border border-teal-200">
                Corridor Coordination Engine
              </span>
              <span className="text-xs font-semibold text-slate-400">Fleet Multi-Agent Demo</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-primary tracking-tight mt-1">
              Multi-EV Corridor Charging Optimization
            </h1>
            <p className="text-xs sm:text-sm text-secondary mt-1 max-w-3xl">
              EVoyage coordinates charging demand across multiple EVs traveling along the same
              expressway to eliminate bottleneck queues and balance grid loads.
            </p>
          </div>

          {/* Corridor Switcher */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCorridor('INDORE_UJJAIN')}
              className={`px-3 py-1.5 rounded-pill text-xs font-semibold transition-all ${
                corridor === 'INDORE_UJJAIN'
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Indore → Ujjain
            </button>
            <button
              onClick={() => setCorridor('INDORE_MAHESHWAR')}
              className={`px-3 py-1.5 rounded-pill text-xs font-semibold transition-all ${
                corridor === 'INDORE_MAHESHWAR'
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Indore → Maheshwar
            </button>
            <button
              onClick={() => fetchSimulation(corridor)}
              disabled={isRunning}
              className="p-2 bg-teal-500 hover:bg-teal-600 text-white rounded-pill transition-colors shadow-sm"
              title="Re-run Simulation"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Bar */}
      {simulationData && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-card rounded-card border border-border p-4 shadow-evoyage">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Fleet Size</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-extrabold text-slate-900">
                {simulationData.metrics.total_vehicles}
              </span>
              <span className="text-xs text-slate-500 font-medium">Active EVs</span>
            </div>
            <p className="text-[11px] text-teal-600 font-semibold mt-1 flex items-center gap-1">
              <Car className="w-3 h-3" /> Shared Expressway
            </p>
          </div>

          <div className="bg-card rounded-card border border-border p-4 shadow-evoyage">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Wait Time Reduction</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-extrabold text-teal-600">
                -{simulationData.metrics.wait_time_reduction_percent}%
              </span>
              <span className="text-xs text-slate-400 line-through">
                {simulationData.metrics.uncoordinated_avg_wait_minutes}m
              </span>
            </div>
            <p className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
              <TrendingDown className="w-3.5 h-3.5" /> Now ~{simulationData.metrics.coordinated_avg_wait_minutes} mins avg
            </p>
          </div>

          <div className="bg-card rounded-card border border-border p-4 shadow-evoyage">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Max Station Queue</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-extrabold text-slate-900">
                {simulationData.after_coordination.max_queue_minutes}m
              </span>
              <span className="text-xs text-rose-500 line-through">
                {simulationData.before_coordination.max_queue_minutes}m
              </span>
            </div>
            <p className="text-[11px] text-teal-600 font-semibold mt-1">No single bottleneck</p>
          </div>

          <div className="bg-card rounded-card border border-border p-4 shadow-evoyage">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Corridor Status</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-sm font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-pill border border-emerald-200">
                Balanced Load
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium mt-1">Zero stranding risk</p>
          </div>
        </div>
      )}

      {/* Before vs After Mode Switcher */}
      <div className="flex items-center justify-center gap-3">
        <div className="bg-slate-100 p-1 rounded-pill border border-border flex items-center">
          <button
            onClick={() => setViewMode('BEFORE')}
            className={`px-4 py-1.5 rounded-pill text-xs font-bold transition-all ${
              viewMode === 'BEFORE'
                ? 'bg-rose-500 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Uncoordinated (Selfish Routing)
          </button>
          <button
            onClick={() => setViewMode('AFTER')}
            className={`px-4 py-1.5 rounded-pill text-xs font-bold transition-all ${
              viewMode === 'AFTER'
                ? 'bg-teal-500 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            EVoyage Coordinated Plan (Recommended)
          </button>
        </div>
      </div>

      {/* Visual Station Queue Breakdown */}
      {simulationData && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(
            viewMode === 'AFTER'
              ? simulationData.after_coordination.station_loads
              : simulationData.before_coordination.station_loads
          ).map(([stName, data], i) => {
            const isCongested = data.queue_minutes >= 30;
            return (
              <div
                key={i}
                className={`p-4 rounded-card border transition-all ${
                  isCongested
                    ? 'bg-rose-50/70 border-rose-200 shadow-sm'
                    : 'bg-card border-border shadow-evoyage'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Station #{i + 1}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 mt-0.5">{stName}</h3>
                  </div>
                  <span
                    className={`text-[10px] font-extrabold px-2 py-0.5 rounded-pill ${
                      isCongested
                        ? 'bg-rose-500 text-white'
                        : 'bg-teal-50 text-teal-700 border border-teal-200'
                    }`}
                  >
                    {data.status}
                  </span>
                </div>

                <div className="mt-4 flex items-baseline justify-between pt-3 border-t border-slate-100">
                  <div>
                    <span className="text-xs text-slate-500">Assigned EVs</span>
                    <p className="text-lg font-extrabold text-slate-900">{data.vehicles} vehicles</p>
                  </div>

                  <div className="text-right">
                    <span className="text-xs text-slate-500">Queue Delay</span>
                    <p
                      className={`text-lg font-extrabold ${
                        isCongested ? 'text-rose-600' : 'text-teal-700'
                      }`}
                    >
                      {data.queue_minutes} mins
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Fleet Vehicles Table */}
      {simulationData && (
        <div className="bg-card rounded-card border border-border p-5 shadow-evoyage">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">
            Simulated Fleet Vehicle Dispatch
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border text-slate-400 font-bold uppercase text-[10px]">
                  <th className="pb-3 pl-2">EV Identifier</th>
                  <th className="pb-3">Battery SOC</th>
                  <th className="pb-3">Current Location</th>
                  <th className="pb-3">Uncoordinated Stop</th>
                  <th className="pb-3">EVoyage Optimized Stop</th>
                  <th className="pb-3">Arrival SOC</th>
                  <th className="pb-3 pr-2">Wait Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {simulationData.vehicles.map((v) => (
                  <tr key={v.vehicle_id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 pl-2 font-bold text-slate-900 flex items-center gap-2">
                      <Car className="w-4 h-4 text-teal-600" />
                      <span>{v.vehicle_name}</span>
                    </td>
                    <td className="py-3">
                      <BatteryIndicator soc={v.soc_percent} size="sm" />
                    </td>
                    <td className="py-3 font-medium text-slate-600">
                      {v.current_distance_from_origin_km} km on corridor
                    </td>
                    <td className="py-3 font-semibold text-rose-600">
                      Sanwer / Rau Hub (45m queue)
                    </td>
                    <td className="py-3 font-bold text-teal-700 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                      <span>
                        {v.soc_percent < 25
                          ? 'Sanwer Road Hub (Low SOC Priority)'
                          : v.soc_percent < 70
                          ? '120 kW Expressway Plaza'
                          : 'Destination Ring Supercharge'}
                      </span>
                    </td>
                    <td className="py-3 font-semibold text-slate-800">
                      {Math.round(v.arrival_soc_percent)}%
                    </td>
                    <td className="py-3 pr-2 font-extrabold text-emerald-600">
                      {v.estimated_wait_minutes} mins
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Explanatory Insights Card */}
      {simulationData && (
        <div className="bg-teal-50/50 rounded-card border border-teal-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <ShieldCheck className="w-5 h-5 text-teal-600" />
            <h3 className="text-sm font-bold text-teal-900">
              Corridor Coordination Logic Explained
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {simulationData.insights.map((insight, idx) => (
              <div key={idx} className="flex items-start gap-2 text-xs text-teal-950 font-medium leading-relaxed">
                <CheckCircle2 className="w-4 h-4 text-teal-600 flex-shrink-0 mt-0.5" />
                <span>{insight}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
