import React, { useState, useRef, useEffect } from 'react';
import { Logo } from './Logo';
import { useVehicle } from '../../context/VehicleContext';
import { useTrip } from '../../context/TripContext';
import {
  Zap,
  Battery,
  LogOut,
  Car,
  User,
  Plus,
  ShieldCheck,
  Check,
  ChevronDown,
  Database
} from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  openOnboarding: () => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab, openOnboarding }) => {
  const {
    userProfile,
    vehicles,
    selectedVehicle,
    setSelectedVehicle,
    updateSOC,
    signOut,
    dbSyncStatus
  } = useVehicle();

  const { tripPlan } = useTrip();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const soc = selectedVehicle?.current_soc_percent ?? 72;
  const rangeKm = tripPlan?.estimated_range_km ?? Math.round(soc * 2.33);

  const navItems = [
    { id: 'route', label: 'Route' },
    { id: 'stations', label: 'Stations' },
    { id: 'coordination', label: 'EV Coordination' },
    { id: 'history', label: 'History' },
  ];

  const userInitial = userProfile?.name ? userProfile.name.charAt(0).toUpperCase() : 'A';

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200/80 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo & Nav */}
        <div className="flex items-center gap-8">
          <Logo variant="header" size="md" showBeta={true} />

          {/* Desktop Nav Links matching reference screenshot */}
          <nav className="hidden md:flex items-center gap-6">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`text-xs font-bold transition-colors ${
                    isActive
                      ? 'text-slate-900 border-b-2 border-slate-900 pb-0.5'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Right Side Header Controls */}
        <div className="flex items-center gap-3">
          {/* Supabase status badge */}
          <div
            title="Connected to Supabase Cloud Database"
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-full text-[11px] font-bold text-slate-600"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                dbSyncStatus === 'synced'
                  ? 'bg-[#14B8A6]'
                  : dbSyncStatus === 'syncing'
                  ? 'bg-amber-400 animate-ping'
                  : 'bg-slate-400'
              }`}
            />
            <span className="text-[10px] uppercase tracking-wider text-slate-500">DB Live</span>
          </div>

          {/* Battery Status Pill matching UI Mockup */}
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-full px-3 py-1.5 shadow-sm">
            {/* Battery Outline with Green Fill */}
            <div className="relative flex items-center">
              <div className="w-5 h-2.5 rounded-sm border border-emerald-500 p-0.5 flex items-center">
                <div
                  className="h-full bg-emerald-500 rounded-xs transition-all"
                  style={{ width: `${Math.min(100, Math.max(10, soc))}%` }}
                />
              </div>
              <div className="w-0.5 h-1 bg-emerald-500 rounded-r-xs ml-[1px]" />
            </div>

            {/* SOC & Range Text */}
            <span className="text-xs font-black text-slate-800 tracking-tight">
              {Math.round(soc)}% <span className="font-normal text-slate-400">· {rangeKm} km</span>
            </span>

            {/* Lightning bolt action icon */}
            <button
              onClick={() => {
                const next = soc >= 80 ? 35 : soc + 20;
                updateSOC(next);
              }}
              title="Toggle Simulated SOC"
              className="w-5 h-5 rounded-full bg-[#0EA5E9] hover:bg-[#0284C7] flex items-center justify-center text-white transition-colors"
            >
              <Zap className="w-3 h-3 fill-white" />
            </button>
          </div>

          {/* User Profile Avatar with Interactive Dropdown */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              title={userProfile ? `${userProfile.name} (${selectedVehicle?.model})` : 'Driver Profile'}
              className="flex items-center gap-1.5 p-1 rounded-full hover:bg-slate-100 transition-all border border-transparent hover:border-slate-200"
            >
              <div className="w-8 h-8 rounded-full bg-[#0F172A] text-white text-xs font-black flex items-center justify-center shadow-sm">
                {userInitial}
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
            </button>

            {/* Profile Dropdown Menu */}
            {isProfileMenuOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl border border-slate-200 shadow-xl py-3 px-3.5 z-50 animate-in fade-in-50 zoom-in-95">
                {/* Driver Info */}
                <div className="pb-3 border-b border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                      Logged in Driver
                    </span>
                    <span className="text-[10px] font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                      Supabase Synced
                    </span>
                  </div>
                  <p className="text-sm font-bold text-slate-900 mt-1">{userProfile?.name || 'Driver'}</p>
                  <p className="text-xs text-slate-500 truncate">{userProfile?.email || 'driver@evoyage.ai'}</p>
                  {userProfile?.phone && (
                    <p className="text-[11px] text-slate-400">{userProfile.phone}</p>
                  )}
                </div>

                {/* Switch Vehicles */}
                <div className="py-2 border-b border-slate-100">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                      Registered Vehicles ({vehicles.length})
                    </span>
                    <button
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        openOnboarding();
                      }}
                      className="text-[11px] font-bold text-teal-600 hover:text-teal-700 flex items-center gap-0.5"
                    >
                      <Plus className="w-3 h-3" /> Add EV
                    </button>
                  </div>

                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {vehicles.map((veh) => {
                      const isSelected = selectedVehicle?.id === veh.id;
                      return (
                        <button
                          key={veh.id}
                          onClick={() => {
                            setSelectedVehicle(veh);
                            setIsProfileMenuOpen(false);
                          }}
                          className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs flex items-center justify-between transition-colors ${
                            isSelected
                              ? 'bg-teal-50/80 border border-teal-200 text-slate-900 font-bold'
                              : 'hover:bg-slate-50 text-slate-600 border border-transparent'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Car className={`w-3.5 h-3.5 ${isSelected ? 'text-teal-600' : 'text-slate-400'}`} />
                            <span className="truncate">{veh.manufacturer} {veh.model}</span>
                          </div>
                          {isSelected && <Check className="w-3.5 h-3.5 text-teal-600 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Actions: Sign Out */}
                <div className="pt-2">
                  <button
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      signOut();
                    }}
                    className="w-full px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-xl transition-colors flex items-center justify-center gap-2"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out / Switch Driver</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Navigation Bar */}
      <div className="md:hidden flex items-center justify-around border-t border-slate-100 bg-white py-2 px-3">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`text-xs font-bold py-1 px-2 ${
                isActive ? 'text-slate-900 border-b-2 border-slate-900' : 'text-slate-500'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </header>
  );
};
