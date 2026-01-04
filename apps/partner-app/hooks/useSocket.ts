import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import type {
  ServerToClientEvents,
  ClientToServerEvents,
  Ride,
  Location,
  CancellationReason,
} from '@ride-hailing/shared-types';
import { usePartnerStore, DEFAULT_PARTNER_ID } from '../stores/partnerStore';
import { TRACKING_INTERVALS } from '@ride-hailing/shared-types';

const SOCKET_URL = 'http://localhost:4000';

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

export function useSocket(partnerId: string = DEFAULT_PARTNER_ID) {
  const socketRef = useRef<TypedSocket | null>(null);
  const locationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const {
    setPartner,
    setRide,
    setIncomingRide,
    setIsConnected,
    setError,
    status,
    ride,
    currentLocation,
    setLastLocationUpdate,
  } = usePartnerStore();

  // Initialize socket connection
  useEffect(() => {
    const socket: TypedSocket = io(SOCKET_URL, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('🔌 Partner connected to server');
      setIsConnected(true);
      setError(null);
      
      // Rejoin ride room if there's an active ride
      const currentRide = usePartnerStore.getState().ride;
      if (currentRide) {
        socket.emit('join:ride', currentRide.id);
      }
    });

    socket.on('disconnect', () => {
      console.log('🔌 Partner disconnected from server');
      setIsConnected(false);
    });

    socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      setError('Connection failed. Retrying...');
    });

    // Ride request from server
    socket.on('ride:request', (ride: Ride) => {
      console.log('📥 Incoming ride request:', ride.id);
      setIncomingRide(ride);
    });

    // Ride state changes
    socket.on('ride:state_change', ({ ride: updatedRide, previousState }) => {
      console.log(`🔄 Ride state: ${previousState} → ${updatedRide.state}`);
      const currentRide = usePartnerStore.getState().ride;
      if (currentRide?.id === updatedRide.id) {
        setRide(updatedRide);
      }
    });

    // Ride cancelled
    socket.on('ride:cancelled', ({ ride: updatedRide, cancellation }) => {
      console.log('🚫 Ride cancelled:', cancellation.reason);
      const currentRide = usePartnerStore.getState().ride;
      if (currentRide?.id === updatedRide.id) {
        setRide(null);
      }
      setIncomingRide(null);
    });

    socket.on('error', (error) => {
      console.error('Socket error:', error);
      setError(error.message);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Fetch partner details
  const fetchPartner = useCallback(async () => {
    try {
      const response = await fetch(`${SOCKET_URL}/api/partners/${partnerId}`);
      const data = await response.json();
      if (data.success) {
        setPartner(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch partner:', error);
    }
  }, [partnerId]);

  // Check for active ride
  const checkActiveRide = useCallback(async () => {
    try {
      const response = await fetch(`${SOCKET_URL}/api/partners/${partnerId}/active-ride`);
      const data = await response.json();
      if (data.success && data.data) {
        setRide(data.data);
        socketRef.current?.emit('join:ride', data.data.id);
      }
    } catch (error) {
      console.error('Failed to check active ride:', error);
    }
  }, [partnerId]);

  useEffect(() => {
    fetchPartner();
    checkActiveRide();
  }, [fetchPartner, checkActiveRide]);

  // Go online
  const goOnline = useCallback((location: Location) => {
    if (!socketRef.current?.connected) {
      setError('Not connected to server');
      return;
    }

    socketRef.current.emit('partner:online', { partnerId, location });
    usePartnerStore.getState().setStatus('ONLINE');
  }, [partnerId]);

  // Go offline
  const goOffline = useCallback(() => {
    if (!socketRef.current?.connected) return;

    socketRef.current.emit('partner:offline', { partnerId });
    usePartnerStore.getState().setStatus('OFFLINE');
    
    // Stop location streaming
    if (locationIntervalRef.current) {
      clearInterval(locationIntervalRef.current);
      locationIntervalRef.current = null;
    }
  }, [partnerId]);

  // Accept ride
  const acceptRide = useCallback((rideId: string) => {
    if (!socketRef.current?.connected) {
      setError('Not connected to server');
      return;
    }

    socketRef.current.emit('ride:accept', { rideId, partnerId });
    socketRef.current.emit('join:ride', rideId);
    
    // Move incoming ride to current ride
    const incomingRide = usePartnerStore.getState().incomingRide;
    if (incomingRide?.id === rideId) {
      setRide(incomingRide);
      setIncomingRide(null);
    }
    
    usePartnerStore.getState().setStatus('BUSY');
  }, [partnerId]);

  // Reject ride
  const rejectRide = useCallback((rideId: string) => {
    if (!socketRef.current?.connected) return;

    socketRef.current.emit('ride:reject', { rideId, partnerId });
    setIncomingRide(null);
  }, [partnerId]);

  // Arrive at pickup
  const arriveAtPickup = useCallback(() => {
    const currentRide = usePartnerStore.getState().ride;
    if (!currentRide || !socketRef.current?.connected) return;

    socketRef.current.emit('ride:arrive', { rideId: currentRide.id });
  }, []);

  // Start trip
  const startTrip = useCallback(() => {
    const currentRide = usePartnerStore.getState().ride;
    if (!currentRide || !socketRef.current?.connected) return;

    socketRef.current.emit('ride:start', { rideId: currentRide.id });
  }, []);

  // Complete trip
  const completeTrip = useCallback(() => {
    const currentRide = usePartnerStore.getState().ride;
    if (!currentRide || !socketRef.current?.connected) return;

    socketRef.current.emit('ride:complete', { rideId: currentRide.id });
    setRide(null);
    usePartnerStore.getState().setStatus('ONLINE');
  }, []);

  // Cancel ride
  const cancelRide = useCallback((reason: CancellationReason) => {
    const currentRide = usePartnerStore.getState().ride;
    if (!currentRide || !socketRef.current?.connected) return;

    socketRef.current.emit('ride:cancel', {
      rideId: currentRide.id,
      reason,
      cancelledBy: 'PARTNER',
    });
    setRide(null);
    usePartnerStore.getState().setStatus('ONLINE');
  }, []);

  // Send location update
  const sendLocationUpdate = useCallback((location: Location) => {
    if (!socketRef.current?.connected) return;

    const currentRide = usePartnerStore.getState().ride;
    socketRef.current.emit('location:update', {
      partnerId,
      location,
      rideId: currentRide?.id,
    });
    setLastLocationUpdate(Date.now());
  }, [partnerId]);

  return {
    socket: socketRef.current,
    goOnline,
    goOffline,
    acceptRide,
    rejectRide,
    arriveAtPickup,
    startTrip,
    completeTrip,
    cancelRide,
    sendLocationUpdate,
  };
}

