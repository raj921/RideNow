import { Server, Socket } from 'socket.io';
import type {
  ServerToClientEvents,
  ClientToServerEvents,
  InterServerEvents,
  SocketData,
  RideState,

} from '@ride-hailing/shared-types';
import { rideService } from '../services/rideService.js';
import { rideMachineManager, calculateFare, estimateDistance, estimateDuration } from '../machines/rideMachine.js';

type TypedServer = Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

const connectedPartners = new Map<string, string>();
const connectedCustomers = new Map<string, string>();
const adminSockets = new Set<string>();

export function setupSocketHandlers(io: TypedServer) {
  io.on('connection', (socket: TypedSocket) => {
    console.log(`🔌 Client connected: ${socket.id}`);


    socket.on('join:admin', () => {
      adminSockets.add(socket.id);
      socket.data.isAdmin = true;
      console.log(`👔 Admin joined: ${socket.id}`);

      const activeRides = rideService.getActive();
      const onlinePartners = rideService.getOnlinePartners();

      for (const ride of activeRides) {
        socket.emit('ride:created', ride);
      }

      for (const partner of onlinePartners) {
        if (partner.currentLocation) {
          socket.emit('partner:location', {
            partnerId: partner.id,
            location: partner.currentLocation,
          });
        }
      }
    });

    socket.on('join:ride', (rideId: string) => {
      socket.join(`ride:${rideId}`);
      console.log(`📍 Socket ${socket.id} joined ride room: ${rideId}`);
    });

    socket.on('leave:ride', (rideId: string) => {
      socket.leave(`ride:${rideId}`);
      console.log(`👋 Socket ${socket.id} left ride room: ${rideId}`);
    });

    socket.on('ride:create', (data) => {
      const { customerId, pickup, dropoff } = data;

      try {
        const ride = rideService.create(customerId, pickup, dropoff);

        rideMachineManager.create({
          rideId: ride.id,
          customerId,
          pickup,
          dropoff,
        });

        socket.join(`ride:${ride.id}`);
        connectedCustomers.set(customerId, socket.id);
        socket.data.customerId = customerId;

        socket.emit('ride:created', ride);

        emitToAdmins(io, 'ride:created', ride);

        console.log(`🚗 Ride created: ${ride.id} for customer ${customerId}`);

        setTimeout(() => {
          const updatedRide = rideService.updateState(ride.id, 'SEARCHING', 'system');
          if (updatedRide) {
            emitStateChange(io, updatedRide, 'REQUESTED');

            setTimeout(() => {
              autoAssignPartner(io, ride.id);
            }, 3000);
          }
        }, 1000);
      } catch (error) {
        socket.emit('error', { message: 'Failed to create ride', code: 'CREATE_FAILED' });
      }
    });

    socket.on('ride:accept', (data) => {
      const { rideId, partnerId } = data;

      try {
        const ride = rideService.getById(rideId);
        if (!ride) {
          socket.emit('error', { message: 'Ride not found', code: 'NOT_FOUND' });
          return;
        }

        if (!rideMachineManager.canTransition(ride.state, 'ASSIGN_PARTNER')) {
          socket.emit('error', { message: 'Invalid state transition', code: 'INVALID_TRANSITION' });
          return;
        }

        const updatedRide = rideService.assignPartner(rideId, partnerId);
        if (updatedRide) {
          socket.join(`ride:${rideId}`);
          connectedPartners.set(partnerId, socket.id);
          socket.data.partnerId = partnerId;

          emitStateChange(io, updatedRide, ride.state);
          console.log(`✅ Partner ${partnerId} accepted ride ${rideId}`);
        }
      } catch (error) {
        socket.emit('error', { message: 'Failed to accept ride', code: 'ACCEPT_FAILED' });
      }
    });

    socket.on('ride:reject', (data) => {
      const { rideId, partnerId } = data;
      console.log(`❌ Partner ${partnerId} rejected ride ${rideId}`);
      setTimeout(() => {
        autoAssignPartner(io, rideId);
      }, 2000);
    });

    socket.on('ride:arrive', (data) => {
      const { rideId } = data;

      try {
        const ride = rideService.getById(rideId);
        if (!ride) {
          socket.emit('error', { message: 'Ride not found', code: 'NOT_FOUND' });
          return;
        }

        if (!rideMachineManager.canTransition(ride.state, 'PARTNER_ARRIVES')) {
          socket.emit('error', { message: 'Invalid state transition', code: 'INVALID_TRANSITION' });
          return;
        }

        const updatedRide = rideService.updateState(rideId, 'PARTNER_ARRIVED', 'partner');
        if (updatedRide) {
          emitStateChange(io, updatedRide, ride.state);
          console.log(`📍 Partner arrived for ride ${rideId}`);
        }
      } catch (error) {
        socket.emit('error', { message: 'Failed to update ride', code: 'UPDATE_FAILED' });
      }
    });

    socket.on('ride:start', (data) => {
      const { rideId } = data;

      try {
        const ride = rideService.getById(rideId);
        if (!ride) {
          socket.emit('error', { message: 'Ride not found', code: 'NOT_FOUND' });
          return;
        }

        if (!rideMachineManager.canTransition(ride.state, 'START_TRIP')) {
          socket.emit('error', { message: 'Invalid state transition', code: 'INVALID_TRANSITION' });
          return;
        }

        const updatedRide = rideService.updateState(rideId, 'TRIP_STARTED', 'partner');
        if (updatedRide) {
          emitStateChange(io, updatedRide, ride.state);
          console.log(`🚀 Trip started for ride ${rideId}`);
        }
      } catch (error) {
        socket.emit('error', { message: 'Failed to start trip', code: 'START_FAILED' });
      }
    });

    socket.on('ride:complete', (data) => {
      const { rideId } = data;

      try {
        const ride = rideService.getById(rideId);
        if (!ride) {
          socket.emit('error', { message: 'Ride not found', code: 'NOT_FOUND' });
          return;
        }

        if (!rideMachineManager.canTransition(ride.state, 'COMPLETE_TRIP')) {
          socket.emit('error', { message: 'Invalid state transition', code: 'INVALID_TRANSITION' });
          return;
        }

        const distanceKm = estimateDistance(
          ride.pickup.lat, ride.pickup.lng,
          ride.dropoff.lat, ride.dropoff.lng
        );
        const durationMinutes = estimateDuration(distanceKm);
        const fare = calculateFare(distanceKm, durationMinutes);

        const updatedRide = rideService.complete(rideId, fare, distanceKm, durationMinutes);
        if (updatedRide) {
          emitStateChange(io, updatedRide, ride.state);
          rideMachineManager.remove(rideId);
          console.log(`🏁 Trip completed for ride ${rideId} - Fare: ₹${fare}`);
        }
      } catch (error) {
        socket.emit('error', { message: 'Failed to complete trip', code: 'COMPLETE_FAILED' });
      }
    });

    socket.on('ride:cancel', (data) => {
      const { rideId, reason, cancelledBy } = data;

      try {
        const ride = rideService.getById(rideId);
        if (!ride) {
          socket.emit('error', { message: 'Ride not found', code: 'NOT_FOUND' });
          return;
        }

        if (!rideMachineManager.canTransition(ride.state, 'CANCEL')) {
          socket.emit('error', { message: 'Cannot cancel in current state', code: 'INVALID_TRANSITION' });
          return;
        }

        const cancellation = {
          id: `cancel-${Date.now()}`,
          rideId,
          cancelledBy,
          reason,
          timestamp: Date.now(),
        };

        const updatedRide = rideService.cancel(rideId, cancelledBy, reason);
        if (updatedRide) {
          io.to(`ride:${rideId}`).emit('ride:cancelled', { ride: updatedRide, cancellation });

          emitToAdmins(io, 'ride:cancelled', { ride: updatedRide, cancellation });

          rideMachineManager.remove(rideId);
          console.log(`🚫 Ride ${rideId} cancelled by ${cancelledBy}: ${reason}`);
        }
      } catch (error) {
        socket.emit('error', { message: 'Failed to cancel ride', code: 'CANCEL_FAILED' });
      }
    });

    socket.on('location:update', (data) => {
      const { partnerId, location, rideId } = data;

      try {
        rideService.updatePartnerLocation(partnerId, location);

        emitToAdmins(io, 'partner:location', { partnerId, location });

        if (rideId) {
          rideService.updateLocation(rideId, location);
          io.to(`ride:${rideId}`).emit('location:broadcast', { rideId, location });
        }
      } catch (error) {
        console.error('Failed to update location:', error);
      }
    });

    socket.on('partner:online', (data) => {
      const { partnerId, location } = data;

      try {
        rideService.updatePartnerStatus(partnerId, 'ONLINE', location);
        connectedPartners.set(partnerId, socket.id);
        socket.data.partnerId = partnerId;

        emitToAdmins(io, 'partner:location', { partnerId, location });

        console.log(`🟢 Partner ${partnerId} is now online`);
      } catch (error) {
        socket.emit('error', { message: 'Failed to go online', code: 'STATUS_FAILED' });
      }
    });

    socket.on('partner:offline', (data) => {
      const { partnerId } = data;

      try {
        rideService.updatePartnerStatus(partnerId, 'OFFLINE');
        connectedPartners.delete(partnerId);

        console.log(`🔴 Partner ${partnerId} is now offline`);
      } catch (error) {
        socket.emit('error', { message: 'Failed to go offline', code: 'STATUS_FAILED' });
      }
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Client disconnected: ${socket.id}`);

      if (socket.data.partnerId) {
        connectedPartners.delete(socket.data.partnerId);
      }

      if (socket.data.customerId) {
        connectedCustomers.delete(socket.data.customerId);
      }

      if (socket.data.isAdmin) {
        adminSockets.delete(socket.id);
      }
    });
  });
}

function emitStateChange(io: TypedServer, ride: any, previousState: RideState) {
  io.to(`ride:${ride.id}`).emit('ride:state_change', { ride, previousState });

  emitToAdmins(io, 'ride:state_change', { ride, previousState });
}

function emitToAdmins(io: TypedServer, event: keyof ServerToClientEvents, data: any) {
  for (const socketId of adminSockets) {
    io.to(socketId).emit(event, data);
  }
}

function autoAssignPartner(io: TypedServer, rideId: string) {
  const ride = rideService.getById(rideId);
  if (!ride || ride.state !== 'SEARCHING') return;

  const availablePartners = rideService.getAvailablePartners();

  if (availablePartners.length === 0) {
    console.log(`⚠️ No available partners for ride ${rideId}`);
    return;
  }

  const partner = availablePartners[Math.floor(Math.random() * availablePartners.length)];

  const partnerSocketId = connectedPartners.get(partner.id);
  if (partnerSocketId) {
    io.to(partnerSocketId).emit('ride:request', ride);
    console.log(`📤 Sent ride request to partner ${partner.id}`);
  } else {
    const updatedRide = rideService.assignPartner(rideId, partner.id);
    if (updatedRide) {
      emitStateChange(io, updatedRide, ride.state);
      console.log(`🤖 Auto-assigned partner ${partner.id} to ride ${rideId}`);

      setTimeout(() => {
        simulateRideProgress(io, rideId);
      }, 5000);
    }
  }
}

function simulateRideProgress(io: TypedServer, rideId: string) {
  const ride = rideService.getById(rideId);
  if (!ride || ride.state === 'CANCELLED' || ride.state === 'TRIP_COMPLETED') return;

  if (ride.state === 'PARTNER_ASSIGNED') {
    const arrivedRide = rideService.updateState(rideId, 'PARTNER_ARRIVED', 'partner');
    if (arrivedRide) {
      emitStateChange(io, arrivedRide, ride.state);
      console.log(`📍 [Simulation] Partner arrived for ride ${rideId}`);
    }
  }
}
