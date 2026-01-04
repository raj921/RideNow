import { useCallback } from 'react';
import { useAdminStore } from '../stores/adminStore';
import type { Partner } from '@ride-hailing/shared-types';

const API_URL = 'http://localhost:4000/api';

export function useApi() {
  const { setActiveRides, setAllRides, setPartners, setCancellations, setStats } = useAdminStore();

  const fetchActiveRides = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/rides/active`);
      const data = await response.json();
      if (data.success) {
        setActiveRides(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch active rides:', error);
    }
  }, [setActiveRides]);

  const fetchAllRides = useCallback(async (page = 1, pageSize = 50) => {
    try {
      const response = await fetch(`${API_URL}/rides?page=${page}&pageSize=${pageSize}`);
      const data = await response.json();
      if (data.success) {
        setAllRides(data.data.items);
      }
    } catch (error) {
      console.error('Failed to fetch rides:', error);
    }
  }, [setAllRides]);

  const fetchRideDetails = useCallback(async (rideId: string) => {
    try {
      const response = await fetch(`${API_URL}/rides/${rideId}`);
      const data = await response.json();
      if (data.success) {
        return data.data;
      }
    } catch (error) {
      console.error('Failed to fetch ride details:', error);
    }
    return null;
  }, []);

  const fetchRideTransitions = useCallback(async (rideId: string) => {
    try {
      const response = await fetch(`${API_URL}/rides/${rideId}/transitions`);
      const data = await response.json();
      if (data.success) {
        return data.data;
      }
    } catch (error) {
      console.error('Failed to fetch transitions:', error);
    }
    return [];
  }, []);

  const fetchPartners = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/partners`);
      const data = await response.json();
      if (data.success) {
        setPartners(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch partners:', error);
    }
  }, [setPartners]);

  const fetchOnlinePartners = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/partners/online`);
      const data = await response.json();
      if (data.success) {
        return data.data as Partner[];
      }
    } catch (error) {
      console.error('Failed to fetch online partners:', error);
    }
    return [];
  }, []);

  const fetchCancellations = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/cancellations`);
      const data = await response.json();
      if (data.success) {
        setCancellations(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch cancellations:', error);
    }
  }, [setCancellations]);

  const fetchStats = useCallback(async () => {
    try {
      const [ridesRes, partnersRes] = await Promise.all([
        fetch(`${API_URL}/stats/rides`),
        fetch(`${API_URL}/partners/online`),
      ]);
      
      const ridesData = await ridesRes.json();
      const partnersData = await partnersRes.json();
      
      if (ridesData.success) {
        const rideStats = ridesData.data;
        setStats({
          totalRides: Object.values(rideStats).reduce((a: number, b: any) => a + b, 0) as number,
          activeRides: (rideStats.REQUESTED || 0) + (rideStats.SEARCHING || 0) + 
                       (rideStats.PARTNER_ASSIGNED || 0) + (rideStats.PARTNER_ARRIVED || 0) + 
                       (rideStats.TRIP_STARTED || 0),
          completedRides: rideStats.TRIP_COMPLETED || 0,
          cancelledRides: rideStats.CANCELLED || 0,
          onlinePartners: partnersData.success ? partnersData.data.length : 0,
        });
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  }, [setStats]);

  return {
    fetchActiveRides,
    fetchAllRides,
    fetchRideDetails,
    fetchRideTransitions,
    fetchPartners,
    fetchOnlinePartners,
    fetchCancellations,
    fetchStats,
  };
}

