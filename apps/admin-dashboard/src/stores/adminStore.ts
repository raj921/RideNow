import { create } from 'zustand';
import type { Ride, Partner, Cancellation, Location } from '@ride-hailing/shared-types';

interface PartnerWithLocation extends Partner {
  liveLocation?: Location;
}

interface AdminStore {
  // Rides
  activeRides: Ride[];
  allRides: Ride[];
  selectedRide: Ride | null;
  
  // Partners
  partners: PartnerWithLocation[];
  onlinePartners: PartnerWithLocation[];
  
  // Cancellations
  cancellations: Cancellation[];
  
  // Stats
  stats: {
    totalRides: number;
    activeRides: number;
    completedRides: number;
    cancelledRides: number;
    onlinePartners: number;
  };
  
  // UI
  isConnected: boolean;
  selectedTab: 'live' | 'rides' | 'cancellations';
  
  // Actions
  setActiveRides: (rides: Ride[]) => void;
  setAllRides: (rides: Ride[]) => void;
  addRide: (ride: Ride) => void;
  updateRide: (ride: Ride) => void;
  setSelectedRide: (ride: Ride | null) => void;
  setPartners: (partners: Partner[]) => void;
  updatePartnerLocation: (partnerId: string, location: Location) => void;
  setCancellations: (cancellations: Cancellation[]) => void;
  addCancellation: (cancellation: Cancellation) => void;
  setStats: (stats: AdminStore['stats']) => void;
  setIsConnected: (connected: boolean) => void;
  setSelectedTab: (tab: AdminStore['selectedTab']) => void;
}

export const useAdminStore = create<AdminStore>((set) => ({
  activeRides: [],
  allRides: [],
  selectedRide: null,
  partners: [],
  onlinePartners: [],
  cancellations: [],
  stats: {
    totalRides: 0,
    activeRides: 0,
    completedRides: 0,
    cancelledRides: 0,
    onlinePartners: 0,
  },
  isConnected: false,
  selectedTab: 'live',

  setActiveRides: (rides) => set({ activeRides: rides }),
  
  setAllRides: (rides) => set({ allRides: rides }),
  
  addRide: (ride) => set((state) => ({
    activeRides: [ride, ...state.activeRides.filter(r => r.id !== ride.id)],
    allRides: [ride, ...state.allRides.filter(r => r.id !== ride.id)],
  })),
  
  updateRide: (ride) => set((state) => {
    const isActive = !['TRIP_COMPLETED', 'CANCELLED'].includes(ride.state);
    return {
      activeRides: isActive
        ? state.activeRides.map(r => r.id === ride.id ? ride : r)
        : state.activeRides.filter(r => r.id !== ride.id),
      allRides: state.allRides.map(r => r.id === ride.id ? ride : r),
      selectedRide: state.selectedRide?.id === ride.id ? ride : state.selectedRide,
    };
  }),
  
  setSelectedRide: (ride) => set({ selectedRide: ride }),
  
  setPartners: (partners) => set({
    partners,
    onlinePartners: partners.filter(p => p.status !== 'OFFLINE'),
  }),
  
  updatePartnerLocation: (partnerId, location) => set((state) => ({
    partners: state.partners.map(p =>
      p.id === partnerId ? { ...p, liveLocation: location, currentLocation: location } : p
    ),
    onlinePartners: state.onlinePartners.map(p =>
      p.id === partnerId ? { ...p, liveLocation: location, currentLocation: location } : p
    ),
  })),
  
  setCancellations: (cancellations) => set({ cancellations }),
  
  addCancellation: (cancellation) => set((state) => ({
    cancellations: [cancellation, ...state.cancellations],
  })),
  
  setStats: (stats) => set({ stats }),
  
  setIsConnected: (isConnected) => set({ isConnected }),
  
  setSelectedTab: (selectedTab) => set({ selectedTab }),
}));

