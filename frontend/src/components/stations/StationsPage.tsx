import React, { useState, useEffect } from 'react';
import { ChargingStation } from '../../types/station';
import { stationService } from '../../services/tripService';
import { supabaseService } from '../../services/supabaseService';
import { ALL_EV_DATASET_STATIONS } from '../../data/evStationsData';
import { StationPopup } from '../map/StationPopup';
import { Search, Filter, Zap, Clock, IndianRupee, MapPin, CheckCircle2, AlertCircle, XCircle, Database } from 'lucide-react';

export const StationsPage: React.FC = () => {
  const [stations, setStations] = useState<ChargingStation[]>(ALL_EV_DATASET_STATIONS);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [corridorFilter, setCorridorFilter] = useState<string>('ALL');
  const [fastOnly, setFastOnly] = useState<boolean>(false);
  const [selectedStation, setSelectedStation] = useState<ChargingStation | null>(null);
  const [isLoadedFromDb, setIsLoadedFromDb] = useState(false);

  useEffect(() => {
    const loadStations = async () => {
      // 1. Try Supabase first
      const dbStations = await supabaseService.getChargingStations();
      if (dbStations && dbStations.length > 0) {
        setStations(dbStations);
        setIsLoadedFromDb(true);
        return;
      }

      // 2. Fallback to local service
      try {
        const localData = await stationService.getStations();
        if (localData && localData.length > 0) {
          setStations(localData);
          return;
        }
      } catch {
        // Fallback to complete realistic dataset
        setStations(ALL_EV_DATASET_STATIONS);
      }
    };
    loadStations();
  }, []);

  const filteredStations = stations.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.address.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || s.status === statusFilter;
    const matchesCorridor = corridorFilter === 'ALL' || s.corridor === corridorFilter;
    const matchesFast = !fastOnly || s.charging_power_kw >= 60;
    return matchesSearch && matchesStatus && matchesCorridor && matchesFast;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="bg-card rounded-card border border-border p-5 sm:p-6 shadow-evoyage">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-primary tracking-tight">
              Charging Stations Directory
            </h1>
            <p className="text-xs sm:text-sm text-secondary mt-1">
              Explore real-time charging status, connector types, active queue lengths, and rates across corridors.
            </p>
          </div>
          {isLoadedFromDb && (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-teal-50 border border-teal-200 rounded-full text-xs font-bold text-teal-700 self-start sm:self-auto">
              <Database className="w-3.5 h-3.5" />
              <span>Live from Supabase</span>
            </div>
          )}
        </div>

        {/* Filter Toolbar */}
        <div className="mt-5 flex flex-col md:flex-row gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by station name or highway..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-border rounded-card text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:bg-white transition-colors"
            />
          </div>

          {/* Corridor Filter */}
          <select
            value={corridorFilter}
            onChange={(e) => setCorridorFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-border rounded-card text-xs font-semibold text-slate-800 outline-none focus:border-teal-500"
          >
            <option value="ALL">All Corridors</option>
            <option value="INDORE_CORRIDOR">Indore Corridor</option>
            <option value="INDORE_UJJAIN">Indore → Ujjain</option>
            <option value="INDORE_MAHESHWAR">Indore → Maheshwar</option>
            <option value="GWALIOR_JAIPUR">Gwalior → Jaipur</option>
          </select>

          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-pill border border-border">
            {['ALL', 'AVAILABLE', 'BUSY', 'OFFLINE'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1 rounded-pill text-xs font-bold transition-all ${
                  statusFilter === status
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          {/* Fast Charger Toggle */}
          <button
            onClick={() => setFastOnly(!fastOnly)}
            className={`px-3 py-1.5 rounded-pill text-xs font-bold transition-all flex items-center gap-1.5 border ${
              fastOnly
                ? 'bg-teal-50 text-teal-700 border-teal-300'
                : 'bg-slate-50 text-slate-600 border-border hover:bg-slate-100'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-teal-600" />
            <span>Fast Charge (&ge;60kW)</span>
          </button>
        </div>
      </div>

      {/* Stations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredStations.map((station) => {
          const isAvail = station.status === 'AVAILABLE';
          const isBusy = station.status === 'BUSY';
          const isOffline = station.status === 'OFFLINE';

          return (
            <div
              key={station.id}
              onClick={() => setSelectedStation(station)}
              className="bg-card rounded-card border border-border p-4 shadow-evoyage hover:shadow-evoyage-md hover:border-teal-500/50 cursor-pointer transition-all flex flex-col justify-between"
            >
              <div>
                {/* Status and Power Header */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span
                    className={`px-2 py-0.5 rounded-pill text-[10px] font-extrabold flex items-center gap-1 ${
                      isAvail
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : isBusy
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}
                  >
                    {isAvail ? <CheckCircle2 className="w-3 h-3" /> : isBusy ? <AlertCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                    {station.status}
                  </span>

                  <span className="text-xs font-extrabold text-sky-600 bg-sky-50 px-2 py-0.5 rounded-pill border border-sky-200 flex items-center gap-1">
                    <Zap className="w-3 h-3 fill-sky-600" />
                    {station.charging_power_kw} kW ({station.connector_type})
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900 leading-snug">{station.name}</h3>
                <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                  <span className="truncate">{station.address}</span>
                </p>
              </div>

              {/* Stats Footer */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1 text-slate-700 font-semibold">
                  <Clock className="w-3.5 h-3.5 text-amber-500" />
                  <span>{station.estimated_wait_minutes}m wait</span>
                </div>

                <div className="text-slate-500 font-medium">
                  {station.available_connectors} / {station.total_connectors} free
                </div>

                <div className="font-bold text-slate-900">
                  ₹{station.price_per_kwh}/kWh
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Detail Popup Modal */}
      {selectedStation && (
        <StationPopup
          station={selectedStation}
          onClose={() => setSelectedStation(null)}
        />
      )}
    </div>
  );
};
