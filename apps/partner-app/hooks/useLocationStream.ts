import { useEffect, useRef, useCallback } from 'react';
import { usePartnerStore } from '../stores/partnerStore';
import type { Location, RideState } from '@ride-hailing/shared-types';
import { TRACKING_INTERVALS, isValidLocationUpdate } from '@ride-hailing/shared-types';

interface UseLocationStreamOptions {
  onLocationUpdate: (location: Location) => void;
  enabled: boolean;
}

// Simulated NYC coordinates for demo
const NYC_CENTER = { lat: 40.7580, lng: -73.9855 };

export function useLocationStream({ onLocationUpdate, enabled }: UseLocationStreamOptions) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastLocationRef = useRef<Location | null>(null);
  const { ride, status, setCurrentLocation, setIsLocationStreaming } = usePartnerStore();

  // Get tracking interval based on current state
  const getTrackingInterval = useCallback((): number => {
    if (!ride) return TRACKING_INTERVALS.IDLE;
    
    switch (ride.state as RideState) {
      case 'PARTNER_ASSIGNED':
        return TRACKING_INTERVALS.TO_PICKUP;
      case 'PARTNER_ARRIVED':
      case 'TRIP_STARTED':
        return TRACKING_INTERVALS.IN_TRIP;
      default:
        return TRACKING_INTERVALS.IDLE;
    }
  }, [ride]);

  // Simulate location (in real app, would use GPS)
  const simulateLocation = useCallback((): Location => {
    const prevLocation = lastLocationRef.current;
    
    // Simulate movement towards a destination
    let targetLat = NYC_CENTER.lat;
    let targetLng = NYC_CENTER.lng;
    
    if (ride) {
      if (ride.state === 'PARTNER_ASSIGNED') {
        // Move towards pickup
        targetLat = ride.pickup.lat;
        targetLng = ride.pickup.lng;
      } else if (ride.state === 'TRIP_STARTED') {
        // Move towards dropoff
        targetLat = ride.dropoff.lat;
        targetLng = ride.dropoff.lng;
      }
    }

    // Calculate new position (move towards target with some randomness)
    const currentLat = prevLocation?.lat ?? NYC_CENTER.lat + (Math.random() - 0.5) * 0.01;
    const currentLng = prevLocation?.lng ?? NYC_CENTER.lng + (Math.random() - 0.5) * 0.01;
    
    const stepSize = 0.0005 + Math.random() * 0.0003; // Small step
    const latDiff = targetLat - currentLat;
    const lngDiff = targetLng - currentLng;
    const distance = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);
    
    let newLat = currentLat;
    let newLng = currentLng;
    
    if (distance > stepSize) {
      newLat = currentLat + (latDiff / distance) * stepSize;
      newLng = currentLng + (lngDiff / distance) * stepSize;
    }
    
    // Add slight randomness to simulate real GPS
    newLat += (Math.random() - 0.5) * 0.0001;
    newLng += (Math.random() - 0.5) * 0.0001;

    const location: Location = {
      lat: newLat,
      lng: newLng,
      timestamp: Date.now(),
      accuracy: 10 + Math.random() * 5,
      speed: 5 + Math.random() * 10,
    };

    return location;
  }, [ride]);

  // Start/stop location streaming
  useEffect(() => {
    if (!enabled || status === 'OFFLINE') {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        setIsLocationStreaming(false);
      }
      return;
    }

    const interval = getTrackingInterval();
    
    // Clear existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Start new interval
    setIsLocationStreaming(true);
    
    const updateLocation = () => {
      const newLocation = simulateLocation();
      const prevLocation = lastLocationRef.current;
      
      // Validate location update (skip if GPS jump detected)
      if (prevLocation && !isValidLocationUpdate(prevLocation, newLocation)) {
        console.warn('⚠️ GPS jump detected, skipping update');
        return;
      }
      
      lastLocationRef.current = newLocation;
      setCurrentLocation(newLocation);
      onLocationUpdate(newLocation);
    };

    // Send initial location
    updateLocation();

    // Set up interval
    intervalRef.current = setInterval(updateLocation, interval);

    console.log(`📍 Location streaming started (interval: ${interval}ms)`);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, status, ride?.state, getTrackingInterval, simulateLocation, onLocationUpdate]);

  // Get current simulated location
  const getCurrentLocation = useCallback((): Location => {
    return simulateLocation();
  }, [simulateLocation]);

  return {
    getCurrentLocation,
    lastLocation: lastLocationRef.current,
  };
}

