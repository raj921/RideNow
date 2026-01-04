import { create } from 'zustand';
import type { Ride, Partner, Location, Address, RideState } from '@ride-hailing/shared-types';

interface RideStore {
  // Current ride
  ride: Ride | null;
  partner: Partner | null;
  partnerLocation: Location | null;
  
  // Booking inputs
  pickup: Address | null;
  dropoff: Address | null;
  
  // UI State
  isBooking: boolean;
  isConnected: boolean;
  error: string | null;
  
  // Actions
  setRide: (ride: Ride | null) => void;
  setPartner: (partner: Partner | null) => void;
  setPartnerLocation: (location: Location | null) => void;
  setPickup: (pickup: Address | null) => void;
  setDropoff: (dropoff: Address | null) => void;
  setIsBooking: (isBooking: boolean) => void;
  setIsConnected: (isConnected: boolean) => void;
  setError: (error: string | null) => void;
  updateRideState: (state: RideState) => void;
  reset: () => void;
}

const initialState = {
  ride: null,
  partner: null,
  partnerLocation: null,
  pickup: null,
  dropoff: null,
  isBooking: false,
  isConnected: false,
  error: null,
};

export const useRideStore = create<RideStore>((set) => ({
  ...initialState,
  
  setRide: (ride) => set({ ride }),
  setPartner: (partner) => set({ partner }),
  setPartnerLocation: (location) => set({ partnerLocation: location }),
  setPickup: (pickup) => set({ pickup }),
  setDropoff: (dropoff) => set({ dropoff }),
  setIsBooking: (isBooking) => set({ isBooking }),
  setIsConnected: (isConnected) => set({ isConnected }),
  setError: (error) => set({ error }),
  
  updateRideState: (state) => set((s) => ({
    ride: s.ride ? { ...s.ride, state } : null,
  })),
  
  reset: () => set(initialState),
}));

// Mock customer ID for demo
export const MOCK_CUSTOMER_ID = 'customer1';

