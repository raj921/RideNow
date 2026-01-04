-- Partners (Drivers)
CREATE TABLE IF NOT EXISTS partners (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  avatar TEXT,
  vehicle_number TEXT NOT NULL,
  vehicle_model TEXT NOT NULL,
  vehicle_color TEXT NOT NULL,
  rating REAL DEFAULT 5.0,
  total_rides INTEGER DEFAULT 0,
  status TEXT DEFAULT 'OFFLINE',
  current_lat REAL,
  current_lng REAL,
  location_timestamp INTEGER,
  created_at INTEGER NOT NULL
);

-- Customers
CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  avatar TEXT,
  rating REAL DEFAULT 5.0,
  total_rides INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL
);

-- Rides
CREATE TABLE IF NOT EXISTS rides (
  id TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL,
  partner_id TEXT,
  state TEXT NOT NULL DEFAULT 'REQUESTED',
  pickup_address TEXT NOT NULL,
  pickup_lat REAL NOT NULL,
  pickup_lng REAL NOT NULL,
  dropoff_address TEXT NOT NULL,
  dropoff_lat REAL NOT NULL,
  dropoff_lng REAL NOT NULL,
  current_lat REAL,
  current_lng REAL,
  current_location_timestamp INTEGER,
  fare REAL,
  distance_km REAL,
  duration_minutes INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  completed_at INTEGER,
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  FOREIGN KEY (partner_id) REFERENCES partners(id)
);

-- Location Breadcrumbs (for ride history/replay)
CREATE TABLE IF NOT EXISTS location_breadcrumbs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ride_id TEXT NOT NULL,
  lat REAL NOT NULL,
  lng REAL NOT NULL,
  timestamp INTEGER NOT NULL,
  FOREIGN KEY (ride_id) REFERENCES rides(id)
);

-- Ride State Transitions (audit log)
CREATE TABLE IF NOT EXISTS ride_state_transitions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ride_id TEXT NOT NULL,
  from_state TEXT,
  to_state TEXT NOT NULL,
  triggered_by TEXT,
  timestamp INTEGER NOT NULL,
  FOREIGN KEY (ride_id) REFERENCES rides(id)
);

-- Cancellations
CREATE TABLE IF NOT EXISTS cancellations (
  id TEXT PRIMARY KEY,
  ride_id TEXT NOT NULL UNIQUE,
  cancelled_by TEXT NOT NULL,
  reason TEXT NOT NULL,
  notes TEXT,
  timestamp INTEGER NOT NULL,
  FOREIGN KEY (ride_id) REFERENCES rides(id)
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_rides_state ON rides(state);
CREATE INDEX IF NOT EXISTS idx_rides_customer ON rides(customer_id);
CREATE INDEX IF NOT EXISTS idx_rides_partner ON rides(partner_id);
CREATE INDEX IF NOT EXISTS idx_rides_created ON rides(created_at);
CREATE INDEX IF NOT EXISTS idx_partners_status ON partners(status);
CREATE INDEX IF NOT EXISTS idx_breadcrumbs_ride ON location_breadcrumbs(ride_id);
CREATE INDEX IF NOT EXISTS idx_transitions_ride ON ride_state_transitions(ride_id);

