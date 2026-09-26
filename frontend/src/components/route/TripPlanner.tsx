import React from 'react';
import { useTrip } from '../../context/TripContext';
import { useVehicle } from '../../context/VehicleContext';
import {
  ArrowUpDown,
  Search,
  Sparkles,
  Loader2,
  Car,
  Zap,
  Play,
  Square,
  ShieldCheck,
  ChevronDown
} from 'lucide-react';

export const TripPlanner: React.FC = () => {
  const {
    origin,
    destination,
    corridorKey,
    setCorridorKey,
    setOrigin,
    setDestination,
    preferenceMode,
    setPreferenceMode,
    planRoute,
    isPlanning,
    selectedRoute,
    isTripActive,
    startTrip,
    stopTrip
  } = useTrip();

  const { vehicles, selectedVehicle, setSelectedVehicle, updateSOC } = useVehicle();

  const handleSwap = () => {
    const temp = origin;
    setOrigin(destination);
    setDestination(temp);
  };

  const corridors = [
    { id: 'INDORE_UJJAIN', label: 'Indore → Ujjain', distance: '55 km' },
    { id: 'INDORE_BHOPAL', label: 'Indore → Bhopal', distance: '195 km' },
    { id: 'INDORE_MAHESHWAR', label: 'Indore → Maheshwar', distance: '91 km' },
    { id: 'GWALIOR_JAIPUR', label: 'Gwalior → Jaipur', distance: '460 km' },
  ];

  const soc = selectedVehicle?.current_soc_percent ?? 72;

  const handleSocChange = (val: number) => {
    updateSOC(val);
  };

  const handlePlanClick = () => {
    planRoute(preferenceMode);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-sm space-y-4">
      {/* 1. Header & Vehicle Selector */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
            Select EV Vehicle
          </span>
        </div>

        {/* Selected Vehicle Dropdown */}
        <div className="relative">
          <select
            value={selectedVehicle?.id || ''}
            onChange={(e) => {
              const found = vehicles.find((v) => v.id === e.target.value);
              if (found) setSelectedVehicle(found);
            }}
            className="pl-2 pr-7 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 outline-none focus:border-[#14B8A6] cursor-pointer"
          >
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {v.manufacturer} {v.model} ({v.battery_capacity_kwh} kWh)
              </option>
            ))}
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-2 pointer-events-none" />
        </div>
      </div>

      {/* 2. Quick Corridor Route Selector */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">
            Quick Corridors
          </span>
          <button
            onClick={handleSwap}
            title="Swap Origin and Destination"
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {corridors.map((c) => (
            <button
              key={c.id}
              onClick={() => setCorridorKey(c.id)}
              className={`px-2.5 py-1 text-[11px] font-bold rounded-full transition-all ${
                corridorKey === c.id
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Origin & Destination Inputs */}
      <div className="space-y-2 relative">
        {/* Origin */}
        <div className="relative flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 transition-all focus-within:border-slate-400 focus-within:bg-white">
          <div className="w-2 h-2 rounded-full bg-slate-900 mr-3 flex-shrink-0" />
          <span className="text-[10px] font-extrabold text-slate-400 uppercase mr-2 tracking-wider">
            FROM
          </span>
          <input
            type="text"
            value={origin}
            onChange={(e) => setOrigin(e.target.value)}
            placeholder="Starting location"
            className="w-full bg-transparent text-xs font-bold text-slate-900 placeholder-slate-400 outline-none"
          />
        </div>

        {/* Destination */}
        <div className="relative flex items-center bg-white border border-slate-900 rounded-xl px-3.5 py-2.5 shadow-sm">
          <div className="w-2 h-2 rounded-full bg-[#14B8A6] mr-3 flex-shrink-0" />
          <span className="text-[10px] font-extrabold text-slate-400 uppercase mr-2 tracking-wider">
            TO
          </span>
          <input
            type="text"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            placeholder="Destination location"
            className="w-full bg-transparent text-xs font-bold text-slate-900 placeholder-slate-400 outline-none"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 ml-2 flex-shrink-0" />
        </div>
      </div>

      {/* 4. Current Battery / SOC Adjustment */}
      <div className="p-3 bg-slate-50/80 border border-slate-200 rounded-xl space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-slate-700 flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-[#14B8A6]" /> Starting Battery Level (SOC)
          </span>
          <span className="font-extrabold text-slate-900 bg-white px-2 py-0.5 rounded-md border border-slate-200">
            {Math.round(soc)}%
          </span>
        </div>

        {/* Slider */}
        <input
          type="range"
          min="10"
          max="100"
          step="1"
          value={soc}
          onChange={(e) => handleSocChange(Number(e.target.value))}
          className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#14B8A6]"
        />

        {/* Quick SOC chips */}
        <div className="flex items-center justify-between gap-1 pt-1">
          {[25, 45, 70, 85, 100].map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => handleSocChange(level)}
              className={`px-2 py-0.5 text-[10px] font-bold rounded-md transition-colors ${
                Math.round(soc) === level
                  ? 'bg-[#14B8A6] text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {level}%
            </button>
          ))}
        </div>
      </div>

      {/* 5. Optimization Mode */}
      <div>
        <span className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider block mb-1.5">
          Optimization Strategy
        </span>
        <div className="grid grid-cols-3 gap-1.5">
          {[
            { id: 'BALANCED', label: 'Balanced' },
            { id: 'FASTEST', label: 'Fastest' },
            { id: 'SAFEST', label: 'Safe Buffer' },
          ].map((mode) => (
            <button
              key={mode.id}
              onClick={() => {
                setPreferenceMode(mode.id);
                planRoute(mode.id);
              }}
              className={`py-1.5 text-xs font-bold rounded-xl border transition-all text-center ${
                preferenceMode === mode.id
                  ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {mode.label}
            </button>
          ))}
        </div>
      </div>

      {/* 6. Primary Action Buttons */}
      <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
        {/* Analyze & Recommend Button */}
        <button
          onClick={handlePlanClick}
          disabled={isPlanning}
          className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 active:bg-black disabled:opacity-70 text-white text-xs font-bold rounded-full shadow-sm transition-all flex items-center justify-center gap-2"
        >
          {isPlanning ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#14B8A6]" />
              <span>Analyzing Route & Chargers...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5 text-[#14B8A6]" />
              <span>Analyze & Recommend Best Route</span>
            </>
          )}
        </button>

        {/* Start / End Drive Toggle Button */}
        {!isTripActive ? (
          <button
            onClick={startTrip}
            title="Start in-transit driving navigation"
            className="px-4 py-2.5 bg-[#14B8A6] hover:bg-[#0D9488] active:scale-95 text-white text-xs font-bold rounded-full shadow-sm transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            <span>Start Drive</span>
          </button>
        ) : (
          <button
            onClick={stopTrip}
            title="End drive session whenever you want"
            className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs font-bold rounded-full shadow-sm transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
          >
            <Square className="w-3.5 h-3.5 fill-white" />
            <span>End Drive</span>
          </button>
        )}
      </div>
    </div>
  );
};
