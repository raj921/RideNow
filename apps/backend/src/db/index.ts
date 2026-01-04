import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize database
const db = new Database(join(__dirname, '../../ride.db'));
db.pragma('journal_mode = WAL');

// Run schema
const schema = readFileSync(join(__dirname, 'schema.sql'), 'utf-8');
db.exec(schema);

export default db;

// ============================================
// PARTNER QUERIES
// ============================================

export const partnerQueries = {
  getAll: db.prepare(`
    SELECT * FROM partners ORDER BY created_at DESC
  `),

  getById: db.prepare(`
    SELECT * FROM partners WHERE id = ?
  `),

  getOnline: db.prepare(`
    SELECT * FROM partners WHERE status IN ('ONLINE', 'BUSY')
  `),

  getAvailable: db.prepare(`
    SELECT * FROM partners WHERE status = 'ONLINE'
  `),

  updateStatus: db.prepare(`
    UPDATE partners SET status = ?, current_lat = ?, current_lng = ?, location_timestamp = ?
    WHERE id = ?
  `),

  updateLocation: db.prepare(`
    UPDATE partners SET current_lat = ?, current_lng = ?, location_timestamp = ?
    WHERE id = ?
  `),

  create: db.prepare(`
    INSERT INTO partners (id, name, phone, email, avatar, vehicle_number, vehicle_model, vehicle_color, rating, total_rides, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `),

  incrementRides: db.prepare(`
    UPDATE partners SET total_rides = total_rides + 1 WHERE id = ?
  `),
};

// ============================================
// CUSTOMER QUERIES
// ============================================

export const customerQueries = {
  getAll: db.prepare(`
    SELECT * FROM customers ORDER BY created_at DESC
  `),

  getById: db.prepare(`
    SELECT * FROM customers WHERE id = ?
  `),

  create: db.prepare(`
    INSERT INTO customers (id, name, phone, email, avatar, rating, total_rides, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `),

  incrementRides: db.prepare(`
    UPDATE customers SET total_rides = total_rides + 1 WHERE id = ?
  `),
};

// ============================================
// RIDE QUERIES
// ============================================

export const rideQueries = {
  getAll: db.prepare(`
    SELECT * FROM rides ORDER BY created_at DESC
  `),

  getById: db.prepare(`
    SELECT * FROM rides WHERE id = ?
  `),

  getActive: db.prepare(`
    SELECT * FROM rides WHERE state NOT IN ('TRIP_COMPLETED', 'CANCELLED')
    ORDER BY created_at DESC
  `),

  getByState: db.prepare(`
    SELECT * FROM rides WHERE state = ? ORDER BY created_at DESC
  `),

  getByCustomer: db.prepare(`
    SELECT * FROM rides WHERE customer_id = ? ORDER BY created_at DESC
  `),

  getByPartner: db.prepare(`
    SELECT * FROM rides WHERE partner_id = ? ORDER BY created_at DESC
  `),

  getActiveByCustomer: db.prepare(`
    SELECT * FROM rides 
    WHERE customer_id = ? AND state NOT IN ('TRIP_COMPLETED', 'CANCELLED')
    ORDER BY created_at DESC LIMIT 1
  `),

  getActiveByPartner: db.prepare(`
    SELECT * FROM rides 
    WHERE partner_id = ? AND state NOT IN ('TRIP_COMPLETED', 'CANCELLED')
    ORDER BY created_at DESC LIMIT 1
  `),

  create: db.prepare(`
    INSERT INTO rides (id, customer_id, state, pickup_address, pickup_lat, pickup_lng, dropoff_address, dropoff_lat, dropoff_lng, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `),

  updateState: db.prepare(`
    UPDATE rides SET state = ?, updated_at = ? WHERE id = ?
  `),

  assignPartner: db.prepare(`
    UPDATE rides SET partner_id = ?, state = 'PARTNER_ASSIGNED', updated_at = ? WHERE id = ?
  `),

  updateLocation: db.prepare(`
    UPDATE rides SET current_lat = ?, current_lng = ?, current_location_timestamp = ?, updated_at = ? WHERE id = ?
  `),

  complete: db.prepare(`
    UPDATE rides SET state = 'TRIP_COMPLETED', completed_at = ?, updated_at = ?, fare = ?, distance_km = ?, duration_minutes = ? WHERE id = ?
  `),

  cancel: db.prepare(`
    UPDATE rides SET state = 'CANCELLED', updated_at = ? WHERE id = ?
  `),

  getPaginated: db.prepare(`
    SELECT * FROM rides ORDER BY created_at DESC LIMIT ? OFFSET ?
  `),

  getCount: db.prepare(`
    SELECT COUNT(*) as count FROM rides
  `),

  getCountByState: db.prepare(`
    SELECT state, COUNT(*) as count FROM rides GROUP BY state
  `),
};

// ============================================
// LOCATION BREADCRUMB QUERIES
// ============================================

export const breadcrumbQueries = {
  create: db.prepare(`
    INSERT INTO location_breadcrumbs (ride_id, lat, lng, timestamp)
    VALUES (?, ?, ?, ?)
  `),

  getByRide: db.prepare(`
    SELECT * FROM location_breadcrumbs WHERE ride_id = ? ORDER BY timestamp ASC
  `),

  deleteByRide: db.prepare(`
    DELETE FROM location_breadcrumbs WHERE ride_id = ?
  `),
};

// ============================================
// STATE TRANSITION QUERIES
// ============================================

export const transitionQueries = {
  create: db.prepare(`
    INSERT INTO ride_state_transitions (ride_id, from_state, to_state, triggered_by, timestamp)
    VALUES (?, ?, ?, ?, ?)
  `),

  getByRide: db.prepare(`
    SELECT * FROM ride_state_transitions WHERE ride_id = ? ORDER BY timestamp ASC
  `),
};

// ============================================
// CANCELLATION QUERIES
// ============================================

export const cancellationQueries = {
  create: db.prepare(`
    INSERT INTO cancellations (id, ride_id, cancelled_by, reason, notes, timestamp)
    VALUES (?, ?, ?, ?, ?, ?)
  `),

  getByRide: db.prepare(`
    SELECT * FROM cancellations WHERE ride_id = ?
  `),

  getAll: db.prepare(`
    SELECT c.*, r.pickup_address, r.dropoff_address 
    FROM cancellations c
    JOIN rides r ON c.ride_id = r.id
    ORDER BY c.timestamp DESC
  `),

  getByReason: db.prepare(`
    SELECT * FROM cancellations WHERE reason = ? ORDER BY timestamp DESC
  `),

  getStats: db.prepare(`
    SELECT reason, cancelled_by, COUNT(*) as count 
    FROM cancellations 
    GROUP BY reason, cancelled_by
  `),
};

