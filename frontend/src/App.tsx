import React, { useState } from 'react';
import { VehicleProvider, useVehicle } from './context/VehicleContext';
import { TripProvider, useTrip } from './context/TripContext';
import { DemoProvider } from './context/DemoContext';
import { Header } from './components/common/Header';
import { TripPlanner } from './components/route/TripPlanner';
import { BatteryCard } from './components/route/BatteryCard';
import { RouteComparison } from './components/route/RouteComparison';
import { WhyThisRoute } from './components/route/WhyThisRoute';
import { DynamicReplanBanner } from './components/route/DynamicReplanBanner';
import { ActiveDriveHUD } from './components/route/ActiveDriveHUD';
import { PreTripOverview } from './components/route/PreTripOverview';
import { TripCompletionModal } from './components/route/TripCompletionModal';
import { GoogleMapView } from './components/map/GoogleMapView';
import { SimulationControls } from './components/simulation/SimulationControls';
import { MultiEVDashboard } from './components/multi_ev/MultiEVDashboard';
import { StationsPage } from './components/stations/StationsPage';
import { HistoryPage } from './components/history/HistoryPage';
import { VehicleOnboardingModal } from './components/onboarding/VehicleOnboardingModal';
import { AuthPortal } from './components/auth/AuthPortal';

const MainLayout: React.FC = () => {
  const { userProfile, isFirstTimeUser } = useVehicle();
  const { isTripActive } = useTrip();
  const [activeTab, setActiveTab] = useState<'route' | 'stations' | 'coordination' | 'history'>('route');
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);

  // If user is visiting for the first time or not authenticated, render AuthPortal
  if (!userProfile || isFirstTimeUser) {
    return <AuthPortal />;
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans text-slate-900 animate-in fade-in duration-300">
      {/* Top Fixed Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={(tab) => setActiveTab(tab as any)}
        openOnboarding={() => setIsOnboardingOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'route' && (
          <div className="space-y-4">
            {/* Top Dynamic Re-planning Notification Banner */}
            <DynamicReplanBanner />

            {/* In-Transit Active Drive Navigation HUD when trip is running */}
            {isTripActive && <ActiveDriveHUD />}

            {/* Desktop Two-Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Control Panel (5 cols on lg) */}
              <div className="lg:col-span-5 space-y-4">
                <TripPlanner />
                <BatteryCard />
                <RouteComparison />
                <WhyThisRoute />
                <SimulationControls />
              </div>

              {/* Right Column: Real-time Satellite Map & Journey Overview */}
              <div className="lg:col-span-7 space-y-4">
                <GoogleMapView />
                {!isTripActive && <PreTripOverview />}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'stations' && <StationsPage />}
        {activeTab === 'coordination' && <MultiEVDashboard />}
        {activeTab === 'history' && <HistoryPage />}
      </main>

      {/* Trip Completed Summary Modal */}
      <TripCompletionModal />

      {/* Add Additional Vehicle Modal */}
      <VehicleOnboardingModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
      />

      {/* Bottom Footer */}
      <footer className="border-t border-slate-200/80 bg-white py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-slate-400">
          evoyage ai • Intelligent EV Routing & Charging Coordination Engine • SGSITS Hackathon Final Round
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <VehicleProvider>
      <TripProvider>
        <DemoProvider>
          <MainLayout />
        </DemoProvider>
      </TripProvider>
    </VehicleProvider>
  );
}
