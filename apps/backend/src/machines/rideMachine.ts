import { createMachine, assign } from 'xstate';
import type {
  RideState,
  RideMachineContext,
  RideMachineEvent,

  Address,
} from '@ride-hailing/shared-types';

export interface RideMachineInput {
  rideId: string;
  customerId: string;
  pickup: Address;
  dropoff: Address;
}

export const createRideMachine = (input: RideMachineInput) => {
  return createMachine({
    id: 'ride',
    initial: 'REQUESTED',
    context: {
      rideId: input.rideId,
      customerId: input.customerId,
      partnerId: undefined,
      pickup: input.pickup,
      dropoff: input.dropoff,
      locations: [],
      fare: undefined,
      cancellation: undefined,
    } as RideMachineContext,
    types: {
      context: {} as RideMachineContext,
      events: {} as RideMachineEvent,
    },
    states: {
      REQUESTED: {
        on: {
          SEARCH: {
            target: 'SEARCHING',
          },
          CANCEL: {
            target: 'CANCELLED',
            actions: assign({
              cancellation: ({ event }) => ({
                id: `cancel-${Date.now()}`,
                rideId: input.rideId,
                cancelledBy: event.cancelledBy,
                reason: event.reason,
                timestamp: Date.now(),
              }),
            }),
          },
        },
      },
      SEARCHING: {
        on: {
          ASSIGN_PARTNER: {
            target: 'PARTNER_ASSIGNED',
            actions: assign({
              partnerId: ({ event }) => event.partnerId,
            }),
          },
          CANCEL: {
            target: 'CANCELLED',
            actions: assign({
              cancellation: ({ event }) => ({
                id: `cancel-${Date.now()}`,
                rideId: input.rideId,
                cancelledBy: event.cancelledBy,
                reason: event.reason,
                timestamp: Date.now(),
              }),
            }),
          },
        },
      },
      PARTNER_ASSIGNED: {
        on: {
          PARTNER_ARRIVES: {
            target: 'PARTNER_ARRIVED',
          },
          CANCEL: {
            target: 'CANCELLED',
            actions: assign({
              cancellation: ({ event }) => ({
                id: `cancel-${Date.now()}`,
                rideId: input.rideId,
                cancelledBy: event.cancelledBy,
                reason: event.reason,
                timestamp: Date.now(),
              }),
            }),
          },
        },
      },
      PARTNER_ARRIVED: {
        on: {
          START_TRIP: {
            target: 'TRIP_STARTED',
          },
          CANCEL: {
            target: 'CANCELLED',
            actions: assign({
              cancellation: ({ event }) => ({
                id: `cancel-${Date.now()}`,
                rideId: input.rideId,
                cancelledBy: event.cancelledBy,
                reason: event.reason,
                timestamp: Date.now(),
              }),
            }),
          },
        },
      },
      TRIP_STARTED: {
        on: {
          COMPLETE_TRIP: {
            target: 'TRIP_COMPLETED',
          },
          CANCEL: {
            target: 'CANCELLED',
            actions: assign({
              cancellation: ({ event }) => ({
                id: `cancel-${Date.now()}`,
                rideId: input.rideId,
                cancelledBy: event.cancelledBy,
                reason: event.reason,
                timestamp: Date.now(),
              }),
            }),
          },
        },
      },
      TRIP_COMPLETED: {
        type: 'final',
      },
      CANCELLED: {
        type: 'final',
      },
    },
  });
};

const activeRideMachines = new Map<string, ReturnType<typeof createRideMachine>>();

export const rideMachineManager = {
  create(input: RideMachineInput) {
    const machine = createRideMachine(input);
    activeRideMachines.set(input.rideId, machine);
    return machine;
  },

  get(rideId: string) {
    return activeRideMachines.get(rideId);
  },

  remove(rideId: string) {
    activeRideMachines.delete(rideId);
  },

  canTransition(currentState: RideState, event: RideMachineEvent['type']): boolean {
    const validTransitions: Record<RideState, RideMachineEvent['type'][]> = {
      REQUESTED: ['SEARCH', 'CANCEL'],
      SEARCHING: ['ASSIGN_PARTNER', 'CANCEL'],
      PARTNER_ASSIGNED: ['PARTNER_ARRIVES', 'CANCEL'],
      PARTNER_ARRIVED: ['START_TRIP', 'CANCEL'],
      TRIP_STARTED: ['COMPLETE_TRIP', 'CANCEL'],
      TRIP_COMPLETED: [],
      CANCELLED: [],
    };

    return validTransitions[currentState]?.includes(event) ?? false;
  },

  getNextState(currentState: RideState, event: RideMachineEvent['type']): RideState | null {
    const stateTransitions: Record<RideState, Partial<Record<RideMachineEvent['type'], RideState>>> = {
      REQUESTED: { SEARCH: 'SEARCHING', CANCEL: 'CANCELLED' },
      SEARCHING: { ASSIGN_PARTNER: 'PARTNER_ASSIGNED', CANCEL: 'CANCELLED' },
      PARTNER_ASSIGNED: { PARTNER_ARRIVES: 'PARTNER_ARRIVED', CANCEL: 'CANCELLED' },
      PARTNER_ARRIVED: { START_TRIP: 'TRIP_STARTED', CANCEL: 'CANCELLED' },
      TRIP_STARTED: { COMPLETE_TRIP: 'TRIP_COMPLETED', CANCEL: 'CANCELLED' },
      TRIP_COMPLETED: {},
      CANCELLED: {},
    };

    return stateTransitions[currentState]?.[event] ?? null;
  },
};

export function calculateFare(
  distanceKm: number,
  durationMinutes: number,
  surgeFactor: number = 1.0
): number {
  const baseFare = 20;
  const perKmRate = 6 + Math.random() * 2;
  const waitingChargePerMin = 1;
  const freeWaitingMinutes = 3;

  const waitingMinutes = Math.max(0, durationMinutes - (distanceKm * 2) - freeWaitingMinutes);
  const waitingCharge = waitingMinutes * waitingChargePerMin;

  const effectiveSurge = Math.min(surgeFactor, 1.3);

  const fare = (baseFare + (distanceKm * perKmRate) + waitingCharge) * effectiveSurge;
  return Math.round(fare);
}

export function estimateDistance(
  pickupLat: number,
  pickupLng: number,
  dropoffLat: number,
  dropoffLng: number
): number {
  const R = 6371;
  const dLat = toRad(dropoffLat - pickupLat);
  const dLng = toRad(dropoffLng - pickupLng);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(pickupLat)) * Math.cos(toRad(dropoffLat)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c * 1.3 * 10) / 10;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

export function estimateDuration(distanceKm: number): number {
  const avgSpeedKmh = 30;
  return Math.round((distanceKm / avgSpeedKmh) * 60);
}
