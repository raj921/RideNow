import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import type { ServerToClientEvents, ClientToServerEvents } from '@ride-hailing/shared-types';
import { useAdminStore } from '../stores/adminStore';

const SOCKET_URL = 'http://localhost:4000';

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

export function useSocket() {
  const socketRef = useRef<TypedSocket | null>(null);
  const {
    addRide,
    updateRide,
    updatePartnerLocation,
    addCancellation,
    setIsConnected,
  } = useAdminStore();

  useEffect(() => {
    const socket: TypedSocket = io(SOCKET_URL, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('🔌 Admin connected to server');
      setIsConnected(true);
      socket.emit('join:admin');
    });

    socket.on('disconnect', () => {
      console.log('🔌 Admin disconnected');
      setIsConnected(false);
    });

    // Ride events
    socket.on('ride:created', (ride) => {
      console.log('📥 New ride:', ride.id);
      addRide(ride);
    });

    socket.on('ride:state_change', ({ ride, previousState }) => {
      console.log(`🔄 Ride ${ride.id}: ${previousState} → ${ride.state}`);
      updateRide(ride);
    });

    socket.on('ride:cancelled', ({ ride, cancellation }) => {
      console.log('🚫 Ride cancelled:', ride.id);
      updateRide(ride);
      addCancellation(cancellation);
    });

    // Location events
    socket.on('partner:location', ({ partnerId, location }) => {
      updatePartnerLocation(partnerId, location);
    });

    socket.on('location:broadcast', ({ rideId, location }) => {
      // Update ride location if needed
      const { activeRides, updateRide: update } = useAdminStore.getState();
      const ride = activeRides.find(r => r.id === rideId);
      if (ride) {
        update({ ...ride, currentLocation: location });
      }
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return socketRef.current;
}

