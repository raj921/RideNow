import { nanoid } from 'nanoid';
import type {
  Ride,
  RideWithDetails,
  Partner,
  Customer,
  Location,
  Address,
  CancellationReason,
  CancelledBy,
  Cancellation,
  RideState,
  RideStateTransition,
  LocationBreadcrumb,
} from '@ride-hailing/shared-types';
import {
  rideQueries,
  partnerQueries,
  customerQueries,
  breadcrumbQueries,
  transitionQueries,
  cancellationQueries,
} from '../db/index.js';

function dbToRide(row: any): Ride {
  return {
    id: row.id,
    customerId: row.customer_id,
    partnerId: row.partner_id || undefined,
    state: row.state as RideState,
    pickup: {
      formatted: row.pickup_address,
      lat: row.pickup_lat,
      lng: row.pickup_lng,
    },
    dropoff: {
      formatted: row.dropoff_address,
      lat: row.dropoff_lat,
      lng: row.dropoff_lng,
    },
    currentLocation: row.current_lat
      ? { lat: row.current_lat, lng: row.current_lng, timestamp: row.current_location_timestamp }
      : undefined,
    fare: row.fare || undefined,
    distanceKm: row.distance_km || undefined,
    durationMinutes: row.duration_minutes || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    completedAt: row.completed_at || undefined,
  };
}

function dbToPartner(row: any): Partner {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    email: row.email,
    avatar: row.avatar || undefined,
    vehicleNumber: row.vehicle_number,
    vehicleModel: row.vehicle_model,
    vehicleColor: row.vehicle_color,
    rating: row.rating,
    totalRides: row.total_rides,
    status: row.status,
    currentLocation: row.current_lat
      ? { lat: row.current_lat, lng: row.current_lng, timestamp: row.location_timestamp }
      : undefined,
    createdAt: row.created_at,
  };
}

function dbToCustomer(row: any): Customer {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    email: row.email,
    avatar: row.avatar || undefined,
    rating: row.rating,
    totalRides: row.total_rides,
    createdAt: row.created_at,
  };
}

function dbToCancellation(row: any): Cancellation {
  return {
    id: row.id,
    rideId: row.ride_id,
    cancelledBy: row.cancelled_by as CancelledBy,
    reason: row.reason as CancellationReason,
    notes: row.notes || undefined,
    timestamp: row.timestamp,
  };
}

function dbToTransition(row: any): RideStateTransition {
  return {
    id: String(row.id),
    rideId: row.ride_id,
    fromState: row.from_state as RideState | null,
    toState: row.to_state as RideState,
    timestamp: row.timestamp,
    triggeredBy: row.triggered_by || undefined,
  };
}

function dbToBreadcrumb(row: any): LocationBreadcrumb {
  return {
    id: String(row.id),
    rideId: row.ride_id,
    lat: row.lat,
    lng: row.lng,
    timestamp: row.timestamp,
  };
}

export const rideService = {
  getAll(): Ride[] {
    const rows = rideQueries.getAll.all();
    return rows.map(dbToRide);
  },

  getById(id: string): Ride | null {
    const row = rideQueries.getById.get(id);
    return row ? dbToRide(row) : null;
  },

  getWithDetails(id: string): RideWithDetails | null {
    const ride = this.getById(id);
    if (!ride) return null;

    const customer = ride.customerId ? this.getCustomer(ride.customerId) : undefined;
    const partner = ride.partnerId ? this.getPartner(ride.partnerId) : undefined;
    const cancellation = cancellationQueries.getByRide.get(id);
    const breadcrumbs = breadcrumbQueries.getByRide.all(id);

    return {
      ...ride,
      customer: customer || undefined,
      partner: partner || undefined,
      cancellation: cancellation ? dbToCancellation(cancellation) : undefined,
      locationBreadcrumbs: breadcrumbs.map(dbToBreadcrumb),
    };
  },

  getActive(): Ride[] {
    const rows = rideQueries.getActive.all();
    return rows.map(dbToRide);
  },

  getByState(state: RideState): Ride[] {
    const rows = rideQueries.getByState.all(state);
    return rows.map(dbToRide);
  },

  getActiveByCustomer(customerId: string): Ride | null {
    const row = rideQueries.getActiveByCustomer.get(customerId);
    return row ? dbToRide(row) : null;
  },

  getActiveByPartner(partnerId: string): Ride | null {
    const row = rideQueries.getActiveByPartner.get(partnerId);
    return row ? dbToRide(row) : null;
  },

  create(customerId: string, pickup: Address, dropoff: Address): Ride {
    const id = `ride-${nanoid(10)}`;
    const now = Date.now();

    rideQueries.create.run(
      id,
      customerId,
      'REQUESTED',
      pickup.formatted,
      pickup.lat,
      pickup.lng,
      dropoff.formatted,
      dropoff.lat,
      dropoff.lng,
      now,
      now
    );

    transitionQueries.create.run(id, null, 'REQUESTED', 'customer', now);

    return this.getById(id)!;
  },

  updateState(id: string, newState: RideState, triggeredBy?: string): Ride | null {
    const ride = this.getById(id);
    if (!ride) return null;

    const now = Date.now();
    const previousState = ride.state;

    rideQueries.updateState.run(newState, now, id);
    transitionQueries.create.run(id, previousState, newState, triggeredBy || 'system', now);

    return this.getById(id);
  },

  assignPartner(rideId: string, partnerId: string): Ride | null {
    const now = Date.now();
    const ride = this.getById(rideId);
    if (!ride) return null;

    rideQueries.assignPartner.run(partnerId, now, rideId);
    transitionQueries.create.run(rideId, ride.state, 'PARTNER_ASSIGNED', 'partner', now);

    const partner = partnerQueries.getById.get(partnerId) as any;
    if (partner) {
      partnerQueries.updateStatus.run('BUSY', partner.current_lat, partner.current_lng, now, partnerId);
    }

    return this.getById(rideId);
  },

  updateLocation(rideId: string, location: Location): void {
    const now = Date.now();
    rideQueries.updateLocation.run(location.lat, location.lng, location.timestamp, now, rideId);
    breadcrumbQueries.create.run(rideId, location.lat, location.lng, location.timestamp);
  },

  complete(rideId: string, fare: number, distanceKm: number, durationMinutes: number): Ride | null {
    const ride = this.getById(rideId);
    if (!ride) return null;

    const now = Date.now();
    rideQueries.complete.run(now, now, fare, distanceKm, durationMinutes, rideId);
    transitionQueries.create.run(rideId, ride.state, 'TRIP_COMPLETED', 'partner', now);

    if (ride.partnerId) {
      const partner = partnerQueries.getById.get(ride.partnerId) as any;
      if (partner) {
        partnerQueries.updateStatus.run('ONLINE', partner.current_lat, partner.current_lng, now, ride.partnerId);
        partnerQueries.incrementRides.run(ride.partnerId);
      }
    }

    customerQueries.incrementRides.run(ride.customerId);

    return this.getById(rideId);
  },

  cancel(rideId: string, cancelledBy: CancelledBy, reason: CancellationReason, notes?: string): Ride | null {
    const ride = this.getById(rideId);
    if (!ride) return null;

    const now = Date.now();
    rideQueries.cancel.run(now, rideId);
    transitionQueries.create.run(rideId, ride.state, 'CANCELLED', cancelledBy.toLowerCase(), now);
    cancellationQueries.create.run(nanoid(), rideId, cancelledBy, reason, notes || null, now);

    if (ride.partnerId) {
      const partner = partnerQueries.getById.get(ride.partnerId) as any;
      if (partner) {
        partnerQueries.updateStatus.run('ONLINE', partner.current_lat, partner.current_lng, now, ride.partnerId);
      }
    }

    return this.getById(rideId);
  },

  getTransitions(rideId: string): RideStateTransition[] {
    const rows = transitionQueries.getByRide.all(rideId);
    return rows.map(dbToTransition);
  },

  getBreadcrumbs(rideId: string): LocationBreadcrumb[] {
    const rows = breadcrumbQueries.getByRide.all(rideId);
    return rows.map(dbToBreadcrumb);
  },

  getPaginated(page: number, pageSize: number): { rides: Ride[]; total: number } {
    const offset = (page - 1) * pageSize;
    const rows = rideQueries.getPaginated.all(pageSize, offset);
    const countRow = rideQueries.getCount.get() as { count: number };

    return {
      rides: rows.map(dbToRide),
      total: countRow.count,
    };
  },

  getStatsByState(): Record<RideState, number> {
    const rows = rideQueries.getCountByState.all() as { state: RideState; count: number }[];
    const stats: Record<string, number> = {};
    for (const row of rows) {
      stats[row.state] = row.count;
    }
    return stats as Record<RideState, number>;
  },

  getPartner(id: string): Partner | null {
    const row = partnerQueries.getById.get(id);
    return row ? dbToPartner(row) : null;
  },

  getAllPartners(): Partner[] {
    const rows = partnerQueries.getAll.all();
    return rows.map(dbToPartner);
  },

  getOnlinePartners(): Partner[] {
    const rows = partnerQueries.getOnline.all();
    return rows.map(dbToPartner);
  },

  getAvailablePartners(): Partner[] {
    const rows = partnerQueries.getAvailable.all();
    return rows.map(dbToPartner);
  },

  updatePartnerStatus(partnerId: string, status: 'ONLINE' | 'OFFLINE' | 'BUSY', location?: Location): Partner | null {
    const partner = this.getPartner(partnerId);
    if (!partner) return null;

    const now = Date.now();
    partnerQueries.updateStatus.run(
      status,
      location?.lat || partner.currentLocation?.lat || null,
      location?.lng || partner.currentLocation?.lng || null,
      now,
      partnerId
    );

    return this.getPartner(partnerId);
  },

  updatePartnerLocation(partnerId: string, location: Location): void {
    partnerQueries.updateLocation.run(location.lat, location.lng, location.timestamp, partnerId);
  },

  getCustomer(id: string): Customer | null {
    const row = customerQueries.getById.get(id);
    return row ? dbToCustomer(row) : null;
  },

  getAllCustomers(): Customer[] {
    const rows = customerQueries.getAll.all();
    return rows.map(dbToCustomer);
  },

  getCancellation(rideId: string): Cancellation | null {
    const row = cancellationQueries.getByRide.get(rideId);
    return row ? dbToCancellation(row) : null;
  },

  getAllCancellations(): Cancellation[] {
    const rows = cancellationQueries.getAll.all();
    return rows.map(dbToCancellation);
  },

  getCancellationStats(): { reason: CancellationReason; cancelledBy: CancelledBy; count: number }[] {
    return cancellationQueries.getStats.all() as any[];
  },
};
