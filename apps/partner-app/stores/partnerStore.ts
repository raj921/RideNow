import { create } from 'zustand';
import type { Ride, Partner, Location, PartnerStatus } from '@ride-hailing/shared-types';

interface PartnerStore {
  // Partner state
  partner: Partner | null;
  status: PartnerStatus;
  currentLocation: Location | null;

  // Ride state
  ride: Ride | null;
  incomingRide: Ride | null;

  // UI state
  isConnected: boolean;
  isLocationStreaming: boolean;
  error: string | null;
  lastLocationUpdate: number | null;

  // Actions
  setPartner: (partner: Partner | null) => void;
  setStatus: (status: PartnerStatus) => void;
  setCurrentLocation: (location: Location | null) => void;
  setRide: (ride: Ride | null) => void;
  setIncomingRide: (ride: Ride | null) => void;
  setIsConnected: (connected: boolean) => void;
  setIsLocationStreaming: (streaming: boolean) => void;
  setError: (error: string | null) => void;
  setLastLocationUpdate: (timestamp: number) => void;
  reset: () => void;
}

const initialState = {
  partner: null,
  status: 'OFFLINE' as PartnerStatus,
  currentLocation: null,
  ride: null,
  incomingRide: null,
  isConnected: false,
  isLocationStreaming: false,
  error: null,
  lastLocationUpdate: null,
};

export const usePartnerStore = create<PartnerStore>((set) => ({
  ...initialState,

  setPartner: (partner) => set({ partner }),
  setStatus: (status) => set({ status }),
  setCurrentLocation: (location) => set({ currentLocation: location }),
  setRide: (ride) => set({ ride }),
  setIncomingRide: (ride) => set({ incomingRide: ride }),
  setIsConnected: (isConnected) => set({ isConnected }),
  setIsLocationStreaming: (isLocationStreaming) => set({ isLocationStreaming }),
  setError: (error) => set({ error }),
  setLastLocationUpdate: (timestamp) => set({ lastLocationUpdate: timestamp }),
  reset: () => set(initialState),
}));

// Vijayawada Partners for demo
export const AVAILABLE_PARTNERS = [
  { id: 'partner1', name: 'Krishna Murthy' },
  { id: 'partner2', name: 'Ravi Teja' },
  { id: 'partner3', name: 'Suresh Babu' },
  { id: 'partner4', name: 'Nagaraju' },
  { id: 'partner5', name: 'Ramesh Reddy' },
];

export const DEFAULT_PARTNER_ID = 'partner1';

