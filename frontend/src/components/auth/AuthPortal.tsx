import React, { useState } from 'react';
import { useVehicle } from '../../context/VehicleContext';
import { Logo } from '../common/Logo';
import {
  User,
  Car,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Zap,
  Lock,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Sparkles,
  Layers,
  ChevronRight,
  Database,
  Info
} from 'lucide-react';

export const AuthPortal: React.FC = () => {
  const { saveUserProfile, addVehicle, signInUser, loading, dbSyncStatus } = useVehicle();

  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signup');
  const [step, setStep] = useState<'profile' | 'vehicle'>('profile');

  // Sign in state
  const [signInIdentifier, setSignInIdentifier] = useState('');
  const [signInError, setSignInError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Sign up Profile fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('Indore, MP');

  // Sign up Vehicle fields
  const [manufacturer, setManufacturer] = useState('Tata Motors');
  const [model, setModel] = useState('Nexon EV Max');
  const [purchaseDate, setPurchaseDate] = useState('2022-06-15');
  const [batteryCapacity, setBatteryCapacity] = useState('40.5');
  const [connectorType, setConnectorType] = useState('CCS2');
  const [currentSoc, setCurrentSoc] = useState('75');
  const [knownIssues, setKnownIssues] = useState('');
  const [efficiency, setEfficiency] = useState('0.145');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  // Live SOH Calculation
  const calculateRealTimeSOH = () => {
    let soh = 100;
    if (purchaseDate) {
      const diffMs = Date.now() - new Date(purchaseDate).getTime();
      const years = diffMs / (1000 * 60 * 60 * 24 * 365.25);
      if (years > 0) {
        soh -= Math.min(30, years * 3.2); // realistic Li-ion degradation curve
      }
    }
    if (knownIssues && knownIssues.trim().length > 0) {
      soh -= 4.0;
    }
    return Math.max(55, Math.round(soh * 10) / 10);
  };

  const currentEstimatedSOH = calculateRealTimeSOH();
  const usableCapacity = (
    (parseFloat(batteryCapacity || '40.5') * currentEstimatedSOH) /
    100
  ).toFixed(1);

  // Handle Quick Demo Login
  const handleDemoLogin = async (demoEmail: string) => {
    setSignInError(null);
    setIsLoggingIn(true);
    const res = await signInUser(demoEmail);
    setIsLoggingIn(false);
    if (!res.success && res.message) {
      setSignInError(res.message);
    }
  };

  // Handle Sign In Submit
  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signInIdentifier.trim()) {
      setSignInError('Please enter your email or phone number');
      return;
    }
    setSignInError(null);
    setIsLoggingIn(true);
    const res = await signInUser(signInIdentifier.trim());
    setIsLoggingIn(false);
    if (!res.success && res.message) {
      setSignInError(res.message);
    }
  };

  // Handle Sign Up Step 1 -> Step 2
  const handleProfileNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !email.trim()) {
      setFeedbackMessage('Please fill in all required driver details.');
      return;
    }
    setFeedbackMessage(null);
    setStep('vehicle');
  };

  // Handle Complete Registration & Vehicle Provisioning
  const handleCompleteRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFeedbackMessage(null);
    try {
      // 1. Save user profile to Supabase & local
      const savedUser = await saveUserProfile({
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        address: address.trim() || 'Indore, MP',
      });

      // 2. Provision vehicle in Supabase & local
      await addVehicle({
        manufacturer,
        model: model.trim(),
        purchase_date: purchaseDate,
        battery_capacity_kwh: parseFloat(batteryCapacity) || 40.5,
        battery_health_percent: currentEstimatedSOH,
        connector_type: connectorType,
        max_charging_power_kw: 50.0,
        average_efficiency_kwh_per_km: parseFloat(efficiency) || 0.145,
        current_soc_percent: parseFloat(currentSoc) || 75.0,
        known_issues: knownIssues.trim(),
      });

      // Unlocks dashboard automatically
    } catch (err: any) {
      console.error('Registration failed:', err);
      setFeedbackMessage(err?.message || 'Failed to complete registration. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center items-center px-4 py-8 font-sans text-slate-900">
      {/* Top Brand Banner */}
      <div className="text-center mb-6 space-y-2">
        <div className="flex justify-center items-center gap-2">
          <Logo variant="header" size="lg" showBeta={true} />
        </div>
        <p className="text-xs sm:text-sm font-semibold text-slate-600 max-w-md mx-auto">
          Intelligent EV Routing & Charging Coordination Engine
        </p>
        <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400">
          <span className="inline-flex items-center gap-1">
            <Database className="w-3 h-3 text-[#14B8A6]" /> Supabase Cloud DB Connected
          </span>
          <span>•</span>
          <span>HACKINDORE 4.0</span>
        </div>
      </div>

      {/* Main Auth Card */}
      <div className="w-full max-w-lg bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 relative">
        {/* Auth Mode Tabs */}
        <div className="flex p-1 bg-slate-100 rounded-xl mb-6">
          <button
            type="button"
            onClick={() => {
              setAuthMode('signup');
              setSignInError(null);
            }}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              authMode === 'signup'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-[#14B8A6]" />
            <span>New Driver Setup</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setAuthMode('signin');
              setFeedbackMessage(null);
            }}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              authMode === 'signin'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Lock className="w-3.5 h-3.5 text-[#0EA5E9]" />
            <span>Sign In / Existing Driver</span>
          </button>
        </div>

        {/* ================= MODE 1: SIGN IN ================= */}
        {authMode === 'signin' && (
          <div className="space-y-5">
            <div>
              <h2 className="text-base font-bold text-slate-900">Welcome Back Driver</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Enter your registered email or phone to restore your vehicle profiles & trip history.
              </p>
            </div>

            {signInError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 flex items-start gap-2">
                <Info className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <span>{signInError}</span>
              </div>
            )}

            <form onSubmit={handleSignInSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Email Address or Phone Number
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={signInIdentifier}
                    onChange={(e) => setSignInIdentifier(e.target.value)}
                    placeholder="e.g. abhay.sharma@evoyage.ai or +91 98765 43210"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 outline-none focus:border-[#14B8A6] focus:bg-white transition-colors"
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full py-2.5 bg-[#14B8A6] hover:bg-[#0D9488] text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center justify-center gap-2"
              >
                {isLoggingIn ? (
                  <span>Checking database...</span>
                ) : (
                  <>
                    <span>Sign In & Open Trip Planner</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Quick Demo Accounts for Hackathon Judges */}
            <div className="pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  ⚡ 1-Click Demo Profiles
                </span>
                <span className="text-[10px] text-teal-600 font-medium">Instant Access</span>
              </div>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => handleDemoLogin('abhay.sharma@evoyage.ai')}
                  className="w-full text-left p-2.5 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-slate-900 text-white text-xs font-black flex items-center justify-center">
                      A
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">Abhay Sharma</p>
                      <p className="text-[11px] text-slate-500">Tata Nexon EV Max • 40.5 kWh (Indore)</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 transition-colors" />
                </button>

                <button
                  type="button"
                  onClick={() => handleDemoLogin('priya.patel@evoyage.ai')}
                  className="w-full text-left p-2.5 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-[#0EA5E9] text-white text-xs font-black flex items-center justify-center">
                      P
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">Priya Patel</p>
                      <p className="text-[11px] text-slate-500">MG ZS EV Long Range • 50.3 kWh (Bhopal)</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 transition-colors" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================= MODE 2: NEW DRIVER REGISTRATION ================= */}
        {authMode === 'signup' && (
          <div>
            {/* Step Indicators */}
            <div className="flex items-center gap-2 mb-5">
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

            {feedbackMessage && (
              <div className="p-3 mb-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700 flex items-start gap-2">
                <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <span>{feedbackMessage}</span>
              </div>
            )}

            {/* STEP 1: Driver Profile Form */}
            {step === 'profile' && (
              <form onSubmit={handleProfileNext} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Driver Full Name *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Abhay Sharma"
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 outline-none focus:border-[#14B8A6] focus:bg-white"
                    />
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Phone Number *
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 outline-none focus:border-[#14B8A6] focus:bg-white"
                      />
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Email Address *
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="driver@evoyage.ai"
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 outline-none focus:border-[#14B8A6] focus:bg-white"
                      />
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    City / Regional Base
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="e.g. Vijay Nagar, Indore, MP"
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 outline-none focus:border-[#14B8A6] focus:bg-white"
                    />
                    <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex justify-end">
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-full shadow-sm transition-all flex items-center gap-1.5"
                  >
                    <span>Next: Vehicle & Battery Specs</span>
                    <ArrowRight className="w-4 h-4 text-[#14B8A6]" />
                  </button>
                </div>
              </form>
            )}

            {/* STEP 2: EV Vehicle Specs & Battery Health Profile */}
            {step === 'vehicle' && (
              <form onSubmit={handleCompleteRegistration} className="space-y-3.5">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Manufacturer</label>
                    <select
                      value={manufacturer}
                      onChange={(e) => setManufacturer(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-[#14B8A6]"
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
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-[#14B8A6]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Purchase Date</label>
                    <input
                      type="date"
                      value={purchaseDate}
                      onChange={(e) => setPurchaseDate(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-[#14B8A6]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Pack Size (kWh)</label>
                    <input
                      type="number"
                      step="0.1"
                      required
                      value={batteryCapacity}
                      onChange={(e) => setBatteryCapacity(e.target.value)}
                      placeholder="40.5"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-[#14B8A6]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Current SOC (%)</label>
                    <input
                      type="number"
                      min="5"
                      max="100"
                      required
                      value={currentSoc}
                      onChange={(e) => setCurrentSoc(e.target.value)}
                      placeholder="75"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-[#14B8A6]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Connector</label>
                    <select
                      value={connectorType}
                      onChange={(e) => setConnectorType(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-[#14B8A6]"
                    >
                      <option value="CCS2">CCS2 (DC Fast)</option>
                      <option value="Type2">Type 2 (AC)</option>
                      <option value="GB/T">GB/T</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Known Degradation / Battery Issues (Optional)
                  </label>
                  <input
                    type="text"
                    value={knownIssues}
                    onChange={(e) => setKnownIssues(e.target.value)}
                    placeholder="e.g. 5% capacity loss during high highway speeds"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-[#14B8A6]"
                  />
                </div>

                {/* Live SOH badge calculation */}
                <div className="p-3 bg-teal-50/70 border border-teal-200/80 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-teal-600 shrink-0" />
                    <div>
                      <span className="text-xs font-bold text-slate-900">Computed Health (SOH):</span>
                      <p className="text-[11px] text-slate-500">
                        Usable Capacity: {usableCapacity} kWh • Aging buffer applied
                      </p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 bg-white border border-teal-300 rounded-full text-xs font-extrabold text-teal-700 shadow-sm">
                    {currentEstimatedSOH}% SOH
                  </span>
                </div>

                {/* Bottom Buttons */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setStep('profile')}
                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 rounded-full hover:bg-slate-100 transition-colors"
                  >
                    Back
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmitting || loading}
                    className="px-6 py-2.5 bg-[#14B8A6] hover:bg-[#0D9488] text-white text-xs font-bold rounded-full shadow-sm transition-all flex items-center gap-2"
                  >
                    {isSubmitting ? (
                      <span>Saving to Supabase...</span>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Complete Setup & Launch Dashboard</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>

      {/* Footer copyright */}
      <div className="mt-8 text-center text-xs text-slate-400">
        evoyage ai • SGSITS Indore Hackathon Final Round • PS1 EV Routing
      </div>
    </div>
  );
};
