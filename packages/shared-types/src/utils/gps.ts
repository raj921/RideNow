/**
 * GPS Validation and Smoothing Utilities
 * Handles GPS jumps, freezes, and quality issues
 */

import type { Location } from '../index';

export interface GPSValidationResult {
  isValid: boolean;
  reason?: 'GPS_JUMP' | 'GPS_FREEZE' | 'LOW_ACCURACY' | 'INVALID_COORDS';
  correctedLocation?: Location;
}

/**
 * Maximum realistic speeds (km/h)
 */
const MAX_SPEEDS = {
  WALKING: 7,
  CYCLING: 50,
  DRIVING: 200,
  FLYING: 900,
} as const;

/**
 * Haversine distance between two coordinates (km)
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
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * Validate a location update for GPS jumps
 */
export function validateLocationUpdate(
  prev: Location,
  next: Location,
  maxSpeedKmh: number = MAX_SPEEDS.DRIVING
): GPSValidationResult {
  // Check for valid coordinates
  if (!isValidCoordinate(next.lat, next.lng)) {
    return { isValid: false, reason: 'INVALID_COORDS' };
  }

  // Check for GPS freeze (same location with significant time delta)
  const timeDeltaMs = next.timestamp - prev.timestamp;
  if (timeDeltaMs > 60000 && prev.lat === next.lat && prev.lng === next.lng) {
    return { isValid: false, reason: 'GPS_FREEZE' };
  }

  // Check for GPS jump (impossible speed)
  const distanceKm = haversineDistance(prev.lat, prev.lng, next.lat, next.lng);
  const timeDeltaHours = timeDeltaMs / (1000 * 60 * 60);
  
  if (timeDeltaHours > 0) {
    const speedKmh = distanceKm / timeDeltaHours;
    if (speedKmh > maxSpeedKmh) {
      return { isValid: false, reason: 'GPS_JUMP' };
    }
  }

  // Check accuracy
  if (next.accuracy && next.accuracy > 100) {
    return { isValid: false, reason: 'LOW_ACCURACY' };
  }

  return { isValid: true };
}

/**
 * Check if coordinates are valid
 */
export function isValidCoordinate(lat: number, lng: number): boolean {
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    !isNaN(lat) &&
    !isNaN(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

/**
 * Kalman filter for GPS smoothing
 */
export class KalmanFilter {
  private lat: number = 0;
  private lng: number = 0;
  private variance: number = -1;
  private minAccuracy: number;

  constructor(minAccuracy: number = 1) {
    this.minAccuracy = minAccuracy;
  }

  process(location: Location): Location {
    const accuracy = location.accuracy || 10;

    if (this.variance < 0) {
      // First reading
      this.lat = location.lat;
      this.lng = location.lng;
      this.variance = accuracy * accuracy;
    } else {
      // Calculate Kalman gain
      const k = this.variance / (this.variance + accuracy * accuracy);

      // Update estimates
      this.lat = this.lat + k * (location.lat - this.lat);
      this.lng = this.lng + k * (location.lng - this.lng);

      // Update variance
      this.variance = (1 - k) * this.variance;
    }

    return {
      lat: this.lat,
      lng: this.lng,
      timestamp: location.timestamp,
      accuracy: Math.sqrt(this.variance),
      heading: location.heading,
      speed: location.speed,
    };
  }

  reset(): void {
    this.variance = -1;
  }
}

/**
 * Moving average filter for location smoothing
 */
export class MovingAverageFilter {
  private buffer: Location[] = [];
  private windowSize: number;

  constructor(windowSize: number = 5) {
    this.windowSize = windowSize;
  }

  process(location: Location): Location {
    this.buffer.push(location);

    if (this.buffer.length > this.windowSize) {
      this.buffer.shift();
    }

    const avgLat = this.buffer.reduce((sum, l) => sum + l.lat, 0) / this.buffer.length;
    const avgLng = this.buffer.reduce((sum, l) => sum + l.lng, 0) / this.buffer.length;

    return {
      lat: avgLat,
      lng: avgLng,
      timestamp: location.timestamp,
      accuracy: location.accuracy,
      heading: location.heading,
      speed: location.speed,
    };
  }

  reset(): void {
    this.buffer = [];
  }
}

/**
 * Detect GPS freeze
 */
export function detectGPSFreeze(
  locations: Location[],
  maxFreezeTimeMs: number = 30000
): boolean {
  if (locations.length < 2) return false;

  const last = locations[locations.length - 1];
  const first = locations[0];

  // Check if location hasn't changed for too long
  const timeDelta = last.timestamp - first.timestamp;
  const distance = haversineDistance(first.lat, first.lng, last.lat, last.lng);

  // If time passed but location is nearly identical
  return timeDelta > maxFreezeTimeMs && distance < 0.001; // ~1 meter
}

/**
 * Calculate bearing between two points
 */
export function calculateBearing(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const dLng = toRad(lng2 - lng1);
  const lat1Rad = toRad(lat1);
  const lat2Rad = toRad(lat2);

  const y = Math.sin(dLng) * Math.cos(lat2Rad);
  const x =
    Math.cos(lat1Rad) * Math.sin(lat2Rad) -
    Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLng);

  let bearing = Math.atan2(y, x);
  bearing = (bearing * 180) / Math.PI;
  bearing = (bearing + 360) % 360;

  return bearing;
}

/**
 * Estimate speed from location history
 */
export function estimateSpeed(locations: Location[]): number {
  if (locations.length < 2) return 0;

  const recent = locations.slice(-5); // Use last 5 points
  let totalDistance = 0;
  let totalTime = 0;

  for (let i = 1; i < recent.length; i++) {
    const prev = recent[i - 1];
    const curr = recent[i];
    
    totalDistance += haversineDistance(prev.lat, prev.lng, curr.lat, curr.lng);
    totalTime += (curr.timestamp - prev.timestamp) / 1000; // seconds
  }

  if (totalTime === 0) return 0;
  
  // Return km/h
  return (totalDistance / totalTime) * 3600;
}

