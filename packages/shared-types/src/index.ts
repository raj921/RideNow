// ============================================
// RIDE STATES & TRANSITIONS
// ============================================

export type RideState =
  | 'REQUESTED'
  | 'SEARCHING'
  | 'PARTNER_ASSIGNED'
  | 'PARTNER_ARRIVED'
  | 'TRIP_STARTED'
  | 'TRIP_COMPLETED'
  | 'CANCELLED';

export const RIDE_STATE_LABELS: Record<RideState, string> = {
  REQUESTED: 'Ride Requested',
  SEARCHING: 'Finding Driver',
  PARTNER_ASSIGNED: 'Driver Assigned',
  PARTNER_ARRIVED: 'Driver Arrived',
  TRIP_STARTED: 'Trip In Progress',
  TRIP_COMPLETED: 'Trip Completed',
  CANCELLED: 'Cancelled',
};

export const ACTIVE_RIDE_STATES: RideState[] = [
  'REQUESTED',
  'SEARCHING',
  'PARTNER_ASSIGNED',
  'PARTNER_ARRIVED',
  'TRIP_STARTED',
];

export const TERMINAL_RIDE_STATES: RideState[] = ['TRIP_COMPLETED', 'CANCELLED'];

// ============================================
// CANCELLATION
// ============================================

export type CancellationReason =
  | 'CUSTOMER_CHANGED_MIND'
  | 'PARTNER_NOT_RESPONDING'
  | 'PARTNER_TOO_FAR'
  | 'CUSTOMER_NOT_FOUND'
  | 'VEHICLE_ISSUE'
  | 'EMERGENCY'
  | 'OTHER';

export type CancelledBy = 'CUSTOMER' | 'PARTNER' | 'SYSTEM';

export const CANCELLATION_REASON_LABELS: Record<CancellationReason, string> = {
  CUSTOMER_CHANGED_MIND: 'Changed my mind',
  PARTNER_NOT_RESPONDING: 'Driver not responding',
  PARTNER_TOO_FAR: 'Driver too far away',
  CUSTOMER_NOT_FOUND: 'Customer not found at pickup',
  VEHICLE_ISSUE: 'Vehicle breakdown',
  EMERGENCY: 'Emergency situation',
  OTHER: 'Other reason',
};

export interface Cancellation {
  id: string;
  rideId: string;
  cancelledBy: CancelledBy;
  reason: CancellationReason;
  notes?: string;
  timestamp: number;
}

// ============================================
// LOCATION
// ============================================

export interface Location {
  lat: number;
  lng: number;
  timestamp: number;
  accuracy?: number;
  heading?: number;
  speed?: number;
}

export interface LocationBreadcrumb {
  id: string;
  rideId: string;
  lat: number;
  lng: number;
  timestamp: number;
}

export interface Address {
  formatted: string;
  lat: number;
  lng: number;
}

// ============================================
// PARTNER (DRIVER)
// ============================================

export type PartnerStatus = 'OFFLINE' | 'ONLINE' | 'BUSY';

export interface Partner {
  id: string;
  name: string;
  phone: string;
  email: string;
  avatar?: string;
  vehicleNumber: string;
  vehicleModel: string;
  vehicleColor: string;
  rating: number;
  totalRides: number;
  status: PartnerStatus;
  currentLocation?: Location;
  createdAt: number;
}

export interface PartnerWithDistance extends Partner {
  distanceKm: number;
  etaMinutes: number;
}

// ============================================
// CUSTOMER
// ============================================

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  avatar?: string;
  rating: number;
  totalRides: number;
  createdAt: number;
}

// ============================================
// RIDE
// ============================================

export interface Ride {
  id: string;
  customerId: string;
  partnerId?: string;
  state: RideState;
  pickup: Address;
  dropoff: Address;
  currentLocation?: Location;
  fare?: number;
  distanceKm?: number;
  durationMinutes?: number;
  createdAt: number;
  updatedAt: number;
  completedAt?: number;
}

export interface RideWithDetails extends Ride {
  customer?: Customer;
  partner?: Partner;
  cancellation?: Cancellation;
  locationBreadcrumbs?: LocationBreadcrumb[];
}

export interface RideStateTransition {
  id: string;
  rideId: string;
  fromState: RideState | null;
  toState: RideState;
  timestamp: number;
  triggeredBy?: string;
}

// ============================================
// SOCKET EVENTS
// ============================================

export interface ServerToClientEvents {
  'ride:state_change': (data: { ride: Ride; previousState: RideState | null }) => void;
  'ride:created': (ride: Ride) => void;
  'ride:cancelled': (data: { ride: Ride; cancellation: Cancellation }) => void;
  'location:broadcast': (data: { rideId: string; location: Location }) => void;
  'partner:location': (data: { partnerId: string; location: Location }) => void;
  'ride:request': (ride: Ride) => void;
  'error': (error: { message: string; code?: string }) => void;
}

export interface ClientToServerEvents {
  'ride:create': (data: { customerId: string; pickup: Address; dropoff: Address }) => void;
  'ride:cancel': (data: { rideId: string; reason: CancellationReason; cancelledBy: CancelledBy }) => void;
  'ride:accept': (data: { rideId: string; partnerId: string }) => void;
  'ride:reject': (data: { rideId: string; partnerId: string }) => void;
  'ride:arrive': (data: { rideId: string }) => void;
  'ride:start': (data: { rideId: string }) => void;
  'ride:complete': (data: { rideId: string }) => void;
  'location:update': (data: { partnerId: string; location: Location; rideId?: string }) => void;
  'partner:online': (data: { partnerId: string; location: Location }) => void;
  'partner:offline': (data: { partnerId: string }) => void;
  'join:ride': (rideId: string) => void;
  'leave:ride': (rideId: string) => void;
  'join:admin': () => void;
}

export interface InterServerEvents {
  ping: () => void;
}

export interface SocketData {
  partnerId?: string;
  customerId?: string;
  isAdmin?: boolean;
}

// ============================================
// API RESPONSES
// ============================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ============================================
// RIDE MACHINE EVENTS (XState)
// ============================================

export type RideMachineEvent =
  | { type: 'SEARCH' }
  | { type: 'ASSIGN_PARTNER'; partnerId: string }
  | { type: 'PARTNER_ARRIVES' }
  | { type: 'START_TRIP' }
  | { type: 'COMPLETE_TRIP' }
  | { type: 'CANCEL'; reason: CancellationReason; cancelledBy: CancelledBy };

export interface RideMachineContext {
  rideId: string;
  customerId: string;
  partnerId?: string;
  pickup: Address;
  dropoff: Address;
  locations: Location[];
  fare?: number;
  cancellation?: Cancellation;
}

// ============================================
// TRACKING INTERVALS
// ============================================

export const TRACKING_INTERVALS = {
  IDLE: 30000,      // 30s when online but no ride
  TO_PICKUP: 5000,  // 5s navigating to customer
  IN_TRIP: 2000,    // 2s during active trip
} as const;

// ============================================
// UTILITY FUNCTIONS
// ============================================

export function isActiveRide(state: RideState): boolean {
  return ACTIVE_RIDE_STATES.includes(state);
}

export function isTerminalState(state: RideState): boolean {
  return TERMINAL_RIDE_STATES.includes(state);
}

export function canCancelRide(state: RideState): boolean {
  return ['REQUESTED', 'SEARCHING', 'PARTNER_ASSIGNED', 'PARTNER_ARRIVED'].includes(state);
}

export function getNextValidStates(currentState: RideState): RideState[] {
  const transitions: Record<RideState, RideState[]> = {
    REQUESTED: ['SEARCHING', 'CANCELLED'],
    SEARCHING: ['PARTNER_ASSIGNED', 'CANCELLED'],
    PARTNER_ASSIGNED: ['PARTNER_ARRIVED', 'CANCELLED'],
    PARTNER_ARRIVED: ['TRIP_STARTED', 'CANCELLED'],
    TRIP_STARTED: ['TRIP_COMPLETED', 'CANCELLED'],
    TRIP_COMPLETED: [],
    CANCELLED: [],
  };
  return transitions[currentState];
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in kilometers
 */
export function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * Validate if a location update is realistic (not a GPS jump)
 * Returns true if valid, false if suspicious
 */
export function isValidLocationUpdate(
  prev: Location,
  next: Location,
  maxSpeedKmh: number = 200
): boolean {
  const distance = haversineDistance(prev.lat, prev.lng, next.lat, next.lng);
  const timeDeltaHours = (next.timestamp - prev.timestamp) / (1000 * 60 * 60);
  
  if (timeDeltaHours <= 0) return false;
  
  const speed = distance / timeDeltaHours;
  return speed <= maxSpeedKmh;
}

/**
 * Generate a unique ID
 */
export function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 9)}`;
}

