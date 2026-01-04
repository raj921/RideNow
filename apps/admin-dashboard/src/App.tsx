import { useEffect, useState } from 'react';
import { useSocket } from './hooks/useSocket';
import { useApi } from './hooks/useApi';
import { useAdminStore } from './stores/adminStore';
import { LiveMap } from './components/LiveMap';
import { RidesTable } from './components/RidesTable';
import { CancellationsTable } from './components/CancellationsTable';
import { StatsCards } from './components/StatsCards';
import { RideDetails } from './components/RideDetails';

type Tab = 'live' | 'rides' | 'cancellations';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('live');
  const { 
    activeRides, 
    allRides, 
    onlinePartners,
    cancellations, 
    stats, 
    isConnected,
    selectedRide,
    setSelectedRide,
  } = useAdminStore();
  
  const { 
    fetchActiveRides, 
    fetchAllRides, 
    fetchPartners, 
    fetchCancellations, 
    fetchStats 
  } = useApi();

  // Initialize socket connection
  useSocket();

  // Initial data fetch
  useEffect(() => {
    fetchActiveRides();
    fetchAllRides();
    fetchPartners();
    fetchCancellations();
    fetchStats();

    // Refresh stats every 30 seconds
    const interval = setInterval(() => {
      fetchStats();
      fetchActiveRides();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: 'live', label: 'Live View', count: activeRides.length },
    { id: 'rides', label: 'All Rides', count: allRides.length },
    { id: 'cancellations', label: 'Cancellations', count: cancellations.length },
  ];

  return (
    <div className="min-h-screen bg-neutral-950">
      {/* Header - Glassmorphic */}
      <header className="glass-header sticky top-0 z-50 px-6 py-4 shadow-level-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-glow-brand">
                <span className="text-xl">🚗</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white tracking-tight">
                  RideNow <span className="text-brand-400 font-normal">Admin</span>
                </h1>
                <p className="text-xs text-neutral-500 uppercase tracking-wider">Dashboard</p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-800/50 border border-neutral-700/50">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
              <span className="text-xs font-medium uppercase tracking-wide ${isConnected ? 'text-green-400' : 'text-red-400'}">
                {isConnected ? 'Live' : 'Disconnected'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-xs text-neutral-400 font-mono">
              {new Date().toLocaleString()}
            </div>
            <div className="w-10 h-10 rounded-xl bg-neutral-800 flex items-center justify-center border border-neutral-700">
              <span className="text-lg">👤</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6 max-w-[1800px] mx-auto">
        {/* Stats - Bento Grid */}
        <div className="mb-8">
          <StatsCards stats={stats} />
        </div>

        {/* Tabs - Underline Style */}
        <div className="flex gap-6 border-b border-neutral-800 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative px-2 pb-3 text-sm font-semibold transition-all duration-200 ${
                activeTab === tab.id
                  ? 'text-brand-400'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <span className="flex items-center gap-2">
                {tab.label}
                {tab.count !== undefined && (
                  <span className={`px-2 py-0.5 rounded-md text-xs font-mono ${
                    activeTab === tab.id 
                      ? 'bg-brand-500/20 text-brand-300' 
                      : 'bg-neutral-800 text-neutral-500'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </span>
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-brand-400 to-brand-600 rounded-full" />
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className={`${selectedRide ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
            {activeTab === 'live' && (
              <div className="space-y-6 animate-fade-in">
                {/* Map - Full Width Card */}
                <div className="glass rounded-2xl p-6 shadow-level-2">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-white font-bold text-lg">Live Tracking</h2>
                    <div className="flex items-center gap-2 text-xs text-neutral-400">
                      <span className="px-2 py-1 rounded-md bg-neutral-800 font-mono">{activeRides.length} active</span>
                    </div>
                  </div>
                  <div className="h-[500px]">
                    <LiveMap 
                      rides={activeRides} 
                      partners={onlinePartners}
                      onRideSelect={setSelectedRide}
                    />
                  </div>
                </div>

                {/* Active Rides List */}
                <div className="glass rounded-2xl p-6 shadow-level-2">
                  <h2 className="text-white font-bold text-lg mb-4">Active Rides</h2>
                  <RidesTable 
                    rides={activeRides} 
                    onRideSelect={setSelectedRide}
                    selectedRideId={selectedRide?.id}
                  />
                </div>
              </div>
            )}

            {activeTab === 'rides' && (
              <div className="glass rounded-2xl p-6 shadow-level-2 animate-fade-in">
                <h2 className="text-white font-bold text-lg mb-4">All Rides</h2>
                <RidesTable 
                  rides={allRides} 
                  onRideSelect={setSelectedRide}
                  selectedRideId={selectedRide?.id}
                />
              </div>
            )}

            {activeTab === 'cancellations' && (
              <div className="glass rounded-2xl p-6 shadow-level-2 animate-fade-in">
                <h2 className="text-white font-bold text-lg mb-4">Cancellations</h2>
                <CancellationsTable cancellations={cancellations} />
              </div>
            )}
          </div>

          {/* Side Panel - Ride Details */}
          {selectedRide && (
            <div className="lg:col-span-1">
              <RideDetails 
                rideId={selectedRide.id} 
                onClose={() => setSelectedRide(null)} 
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

