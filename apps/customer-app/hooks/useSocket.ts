import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import type {
  ServerToClientEvents,
  ClientToServerEvents,
  Ride,
  Location,
  CancellationReason,
} from '@ride-hailing/shared-types';
import { useRideStore, MOCK_CUSTOMER_ID } from '../stores/rideStore';

const SOCKET_URL = 'http://localhost:4000';

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

export function useSocket() {
  const socketRef = useRef<TypedSocket | null>(null);
  const {
    setRide,
    setPartner,
    setPartnerLocation,
    setIsConnected,
    setError,
    ride,
  } = useRideStore();

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
      console.log('🔌 Connected to server');
      setIsConnected(true);
      setError(null);
      
      // Rejoin ride room if there's an active ride
      const currentRide = useRideStore.getState().ride;
      if (currentRide) {
        socket.emit('join:ride', currentRide.id);
      }
    });

    socket.on('disconnect', () => {
      console.log('🔌 Disconnected from server');
      setIsConnected(false);
    });

    socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      setError('Connection failed. Retrying...');
    });

    // Ride events
    socket.on('ride:created', (ride: Ride) => {
      console.log('🚗 Ride created:', ride);
      setRide(ride);
      socket.emit('join:ride', ride.id);
    });

    socket.on('ride:state_change', ({ ride, previousState }) => {
      console.log(`🔄 Ride state: ${previousState} → ${ride.state}`);
      setRide(ride);
      
      // Fetch partner details when assigned
      if (ride.state === 'PARTNER_ASSIGNED' && ride.partnerId) {
        fetchPartner(ride.partnerId);
      }
    });

    socket.on('ride:cancelled', ({ ride, cancellation }) => {
      console.log('🚫 Ride cancelled:', cancellation.reason);
      setRide(ride);
      setPartner(null);
      setPartnerLocation(null);
    });

    socket.on('location:broadcast', ({ rideId, location }) => {
      const currentRide = useRideStore.getState().ride;
      if (currentRide?.id === rideId) {
        setPartnerLocation(location);
      }
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
  const fetchPartner = async (partnerId: string) => {
    try {
      const response = await fetch(`${SOCKET_URL}/api/partners/${partnerId}`);
      const data = await response.json();
      if (data.success) {
        setPartner(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch partner:', error);
    }
  };

  // Book a ride
  const bookRide = useCallback((pickup: any, dropoff: any) => {
    if (!socketRef.current?.connected) {
      setError('Not connected to server');
      return;
    }

    socketRef.current.emit('ride:create', {
      customerId: MOCK_CUSTOMER_ID,
      pickup,
      dropoff,
    });
  }, []);

  // Cancel ride
  const cancelRide = useCallback((reason: CancellationReason) => {
    const currentRide = useRideStore.getState().ride;
    if (!currentRide || !socketRef.current?.connected) return;

    socketRef.current.emit('ride:cancel', {
      rideId: currentRide.id,
      reason,
      cancelledBy: 'CUSTOMER',
    });
  }, []);

  return {
    socket: socketRef.current,
    bookRide,
    cancelRide,
    isConnected: useRideStore.getState().isConnected,
  };
}

