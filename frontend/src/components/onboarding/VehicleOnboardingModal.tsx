import React, { useState } from 'react';
import { useVehicle } from '../../context/VehicleContext';
import { X, Car, User, ShieldCheck, Check, Info, Sparkles, AlertTriangle } from 'lucide-react';
import { Logo } from '../common/Logo';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  forceOnboarding?: boolean;
}

export const VehicleOnboardingModal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  forceOnboarding = false,
}) => {
  const { userProfile, saveUserProfile, addVehicle } = useVehicle();

  // Step state
  const [step, setStep] = useState<'profile' | 'vehicle'>(userProfile ? 'vehicle' : 'profile');

  // User Profile fields
  const [name, setName] = useState(userProfile?.name || '');
  const [phone, setPhone] = useState(userProfile?.phone || '');
  const [email, setEmail] = useState(userProfile?.email || '');
  const [address, setAddress] = useState(userProfile?.address || '');

  // Vehicle fields
  const [manufacturer, setManufacturer] = useState('Tata Motors');
  const [model, setModel] = useState('Nexon EV Max');
  const [purchaseDate, setPurchaseDate] = useState('2022-05-10');
  const [batteryCapacity, setBatteryCapacity] = useState('40.5');
  const [connectorType, setConnectorType] = useState('CCS2');
  const [currentSoc, setCurrentSoc] = useState('72');
  const [knownIssues, setKnownIssues] = useState('');
  const [efficiency, setEfficiency] = useState('0.145');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  // Real-time calculated SOH degradation
  const calculateRealTimeSOH = () => {
    let soh = 100;
    if (purchaseDate) {
      const diffMs = Date.now() - new Date(purchaseDate).getTime();
      const years = diffMs / (1000 * 60 * 60 * 24 * 365.25);
      if (years > 0) {
        soh -= Math.min(30, years * 3.2); // 3.2% per year
      }
    }
    if (knownIssues && knownIssues.trim().length > 0) {
      soh -= 4.0;
    }
    return Math.max(55, Math.round(soh * 10) / 10);
  };

  const currentEstimatedSOH = calculateRealTimeSOH();

  const handleProfileNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) return;
    saveUserProfile({
      name,
      phone,
      email: email || `${phone}@evoyage.user`,
      address: address || 'Indore, MP',
    });
    setStep('vehicle');
  };

  const handleVehicleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await addVehicle({
        manufacturer,
        model,
        purchase_date: purchaseDate,
        battery_capacity_kwh: parseFloat(batteryCapacity) || 40.5,
        battery_health_percent: currentEstimatedSOH,
        connector_type: connectorType,
        max_charging_power_kw: 50.0,
        average_efficiency_kwh_per_km: parseFloat(efficiency) || 0.145,
        current_soc_percent: parseFloat(currentSoc) || 72.0,
        known_issues: knownIssues,
      });
      onClose();
    } catch (err) {
      console.warn('Vehicle add failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-lg p-6 shadow-2xl relative animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <Logo variant="header" size="sm" />
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {step === 'profile' ? 'Welcome to EVoyage AI' : 'Vehicle & Battery Health Profile'}
              </h2>
              <p className="text-xs text-slate-500">
                {step === 'profile'
                  ? 'Set up your driver details for personalized routing'
                  : 'Configure real-world battery health & aging buffer'}
              </p>
            </div>
          </div>

          {!forceOnboarding && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Step Tabs */}
        <div className="flex items-center gap-2 my-4">
          <div
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold text-center flex items-center justify-center gap-1.5 transition-all ${
              step === 'profile'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>1. Driver Profile</span>
          </div>

          <div
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold text-center flex items-center justify-center gap-1.5 transition-all ${
              step === 'vehicle'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            <Car className="w-3.5 h-3.5" />
            <span>2. Vehicle & Health</span>
          </div>
        </div>

        {/* STEP 1: Driver Profile Form */}
        {step === 'profile' && (
          <form onSubmit={handleProfileNext} className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Abhay Sharma"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-teal-500 focus:bg-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number *</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-teal-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="driver@evoyage.ai"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-teal-500 focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">City / Home Address</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. Vijay Nagar, Indore, MP"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-teal-500 focus:bg-white"
              />
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-full shadow-sm transition-all flex items-center gap-1.5"
              >
                <span>Continue to Vehicle Setup</span>
                <Check className="w-4 h-4 text-teal-400" />
              </button>
            </div>
          </form>
        )}

        {/* STEP 2: Vehicle Specs & Battery Health */}
        {step === 'vehicle' && (
          <form onSubmit={handleVehicleSubmit} className="space-y-3.5">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Manufacturer</label>
                <select
                  value={manufacturer}
                  onChange={(e) => setManufacturer(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-teal-500"
                >
                  <option value="Tata Motors">Tata Motors</option>
                  <option value="MG Motors">MG Motors</option>
                  <option value="Mahindra">Mahindra</option>
                  <option value="Hyundai">Hyundai</option>
                  <option value="BYD">BYD</option>
                  <option value="Kia">Kia</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Model Name</label>
                <input
                  type="text"
                  required
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="e.g. Nexon EV Max"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-teal-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Purchase Date / Year</label>
                <input
                  type="date"
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Battery Capacity (kWh)</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={batteryCapacity}
                  onChange={(e) => setBatteryCapacity(e.target.value)}
                  placeholder="40.5"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-teal-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Current Battery (SOC %)</label>
                <input
                  type="number"
                  min="5"
                  max="100"
                  required
                  value={currentSoc}
                  onChange={(e) => setCurrentSoc(e.target.value)}
                  placeholder="72"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Connector</label>
                <select
                  value={connectorType}
                  onChange={(e) => setConnectorType(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-teal-500"
                >
                  <option value="CCS2">CCS2 (Fast DC)</option>
                  <option value="Type2">Type 2 (AC)</option>
                  <option value="GB/T">GB/T</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Known Battery Issues / Status (Optional)
              </label>
              <input
                type="text"
                value={knownIssues}
                onChange={(e) => setKnownIssues(e.target.value)}
                placeholder="e.g. Noticeable range drop in winter or AC use"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-teal-500"
              />
            </div>

            {/* Live Computed SOH degradation badge */}
            <div className="p-3 bg-teal-50/70 border border-teal-200/80 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-teal-600" />
                <div>
                  <span className="text-xs font-bold text-slate-900">Computed Health (SOH):</span>
                  <p className="text-[11px] text-slate-500">
                    Real usable capacity: {((parseFloat(batteryCapacity || '40.5') * currentEstimatedSOH) / 100).toFixed(1)} kWh
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 bg-white border border-teal-300 rounded-full text-xs font-extrabold text-teal-700 shadow-sm">
                {currentEstimatedSOH}% SOH
              </span>
            </div>

            {/* Buttons */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setStep('profile')}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 rounded-full hover:bg-slate-100"
              >
                Back
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-full shadow-sm transition-all flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Save & Launch Trip Planner</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
