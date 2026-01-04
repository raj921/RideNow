# 🚗 RideNow - Real-Time Ride-Hailing System

A comprehensive ride-hailing platform demonstrating real-time state management, live tracking, and cross-platform architecture.

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    RIDE-HAILING SYSTEM                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  📱 CUSTOMER APP (Port 3000)     📱 PARTNER APP (Port 3001)     │
│  ├─ Expo Web                     ├─ Expo Web                    │
│  ├─ NativeWind (Tailwind)        ├─ NativeWind (Tailwind)       │
│  └─ Socket.IO Client             └─ Socket.IO Client            │
│                                                                 │
│  🖥️  ADMIN DASHBOARD (Port 5173)                                │
│  ├─ Vite + React                                                │
│  ├─ Tailwind CSS                                                │
│  ├─ Mapbox GL JS                                                │
│  └─ Socket.IO Client                                            │
│                                                                 │
│  ⚡ BACKEND (Port 4000)                                         │
│  ├─ Node.js + Express                                           │
│  ├─ Socket.IO Server                                            │
│  ├─ XState (State Machine)                                      │
│  └─ SQLite (better-sqlite3)                                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 🔄 Ride State Machine

```
REQUESTED → SEARCHING → PARTNER_ASSIGNED → PARTNER_ARRIVED → TRIP_STARTED → TRIP_COMPLETED
    ↓           ↓              ↓                  ↓               ↓
    └───────────┴──────────────┴──────────────────┴───────────────┴───→ CANCELLED
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- pnpm 8+ (`npm install -g pnpm`)

### Installation

```bash
# Clone and install dependencies
cd ride-hailing
pnpm install

# Seed the database with demo data
pnpm --filter backend db:seed
```

### Running the Apps

Start each app in a separate terminal:

```bash
# Terminal 1: Backend (http://localhost:4000)
pnpm dev:backend

# Terminal 2: Customer App (http://localhost:3000)
pnpm dev:customer

# Terminal 3: Partner App (http://localhost:3001)
pnpm dev:partner

# Terminal 4: Admin Dashboard (http://localhost:5173)
pnpm dev:admin
```

Or run all at once:

```bash
pnpm dev
```

## 📱 Applications

### Customer App (Port 3000)

- Book rides with pickup/dropoff locations
- Real-time tracking of partner location
- Live ride state updates
- Cancellation with reason selection
- Fare display on completion

### Partner App (Port 3001)

- Go online/offline toggle
- Accept/reject incoming ride requests
- Navigate to pickup and dropoff
- Location streaming during rides
- Complete trip functionality

### Admin Dashboard (Port 5173)

- Real-time map with all active rides
- Live partner locations
- Ride state transitions timeline
- Cancellation monitoring
- Historical ride data

## 🔌 API Endpoints

### REST API (http://localhost:4000/api)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/rides` | Get all rides (paginated) |
| GET | `/rides/active` | Get active rides |
| GET | `/rides/:id` | Get ride details |
| POST | `/rides` | Create new ride |
| POST | `/rides/:id/cancel` | Cancel ride |
| GET | `/partners` | Get all partners |
| GET | `/partners/online` | Get online partners |
| GET | `/customers` | Get all customers |
| GET | `/cancellations` | Get all cancellations |

### Socket.IO Events

#### Client → Server

| Event | Description |
|-------|-------------|
| `ride:create` | Create a new ride |
| `ride:accept` | Partner accepts ride |
| `ride:reject` | Partner rejects ride |
| `ride:arrive` | Partner arrived at pickup |
| `ride:start` | Start the trip |
| `ride:complete` | Complete the trip |
| `ride:cancel` | Cancel the ride |
| `location:update` | Partner location update |
| `partner:online` | Partner goes online |
| `partner:offline` | Partner goes offline |

#### Server → Client

| Event | Description |
|-------|-------------|
| `ride:created` | New ride created |
| `ride:state_change` | Ride state changed |
| `ride:cancelled` | Ride cancelled |
| `ride:request` | New ride request for partner |
| `location:broadcast` | Partner location update |
| `partner:location` | Partner location (admin) |

## 🧪 Demo Flow

1. **Open Admin Dashboard** (http://localhost:5173)
   - See the live map and stats

2. **Open Partner App** (http://localhost:3001)
   - Select a partner (e.g., Mike Driver)
   - Toggle "Go Online"

3. **Open Customer App** (http://localhost:3000)
   - Select pickup (e.g., Times Square)
   - Select dropoff (e.g., Central Park)
   - Click "Book Ride"

4. **Watch the flow:**
   - Ride created → Searching → Partner Assigned
   - Partner receives ride request
   - In Partner App: Tap "Arrived at Pickup"
   - In Partner App: Tap "Start Trip"
   - In Partner App: Tap "Complete Trip"

5. **View in Admin Dashboard:**
   - See ride moving on map
   - Click on ride for details
   - View state transition timeline

## 📁 Project Structure

```
ride-hailing/
├── apps/
│   ├── customer-app/       # Expo Web customer app
│   ├── partner-app/        # Expo Web driver app
│   ├── admin-dashboard/    # Vite React dashboard
│   └── backend/            # Node.js API + Socket.IO
├── packages/
│   └── shared-types/       # TypeScript types
├── package.json            # Root workspace config
└── pnpm-workspace.yaml     # pnpm workspace
```

## 🛡️ Edge Case Handling

### Network Resilience
- Automatic reconnection with exponential backoff
- Offline queue for location updates
- State sync on reconnect

### GPS Validation
- GPS jump detection (impossible speed)
- GPS freeze detection
- Kalman filter for smoothing
- Accuracy threshold filtering

### App Backgrounding
- Resume tracking on app reopen
- Fetch latest state via REST
- Reconcile with socket stream

## 🎨 Design Decisions

1. **XState for State Machine**: Ensures valid state transitions only
2. **Socket.IO Rooms**: Each ride gets its own room for targeted broadcasts
3. **SQLite**: Simple, zero-config database perfect for demo
4. **Monorepo**: Shared types between all apps
5. **Mock Auth**: Hardcoded users for demo simplicity

## 📝 Mock Users

### Customers
- `customer1` - John Doe
- `customer2` - Jane Smith
- `customer3` - Bob Wilson

### Partners (Drivers)
- `partner1` - Mike Driver
- `partner2` - Sarah Wheels
- `partner3` - Tom Speedster
- `partner4` - Lisa Road
- `partner5` - Chris Lane

## 🔧 Tech Stack

| Component | Technology |
|-----------|------------|
| Customer/Partner Apps | Expo Web, NativeWind, Zustand |
| Admin Dashboard | Vite, React, Tailwind, Mapbox GL |
| Backend | Node.js, Express, Socket.IO |
| State Machine | XState v5 |
| Database | SQLite (better-sqlite3) |
| Real-time | Socket.IO |
| Language | TypeScript |

## 📄 License

MIT

