# System Design: Real-time Ride Tracking & State Management

Regional ride-hailing platform operating under:

Unstable mobile networks

Incorrect GPS signals

OS-level Background Restrictions

Backend is the single source of truth.

Lifecycle of a ride is enforced using a deterministic Finite State Machine (FSM)

Real-time data (locations, sockets) are considered to be ephemeral, but billing and audit data persists.

Part 1: Ride Lifecycle & State Machine

The ride life cycle is modelled as a strict FSM to avoid invalid transitions and race conditions, or double billing.

State: REQUESTED

Caused by:

Customer

Allowed transitions:

→ Searching

→ CANCELLED

Disallowed transitions:

→ PARTNER_ASSIGNED

TRIP_STARTED →

Backend responsibility:

Validate Pickup and Drop Coordinates

Generate immutable Ride ID

Persist ride intent in database

Start TTL/validity timer (auto-expire if no partner is found)

Emit ride_requested event to internal monitoring/admin systems

Statement: SEARCHING

Triggered by:

System (automatic after REQUESTED)

Allowed transitions:

→ PARTNER_ASSIGNED

→ CANCELLED

Disallowed transitions:

TRIP_STARTED →

It will be the backend's responsibility to:

Search geospatial index for nearby available partners

Apply eligibility filters: vehicle type, status, and compliance

Dispatch ride offers sequentially or in batches

Handle retry, timeout, and partner rejections

Ensure only one partner can accept - atomic lock

Statement: PARTNER_ASSIGNED

Triggered by:

Partner: accepts ride

Allowed transitions:

→ PARTNER_ARRIVED

→ CANCELLED

Disallowed Transitions:

TRIP_STARTED →

Backend responsibility:

Lock partner state to BUSY

Create isolated real-time channel for the ride

Share partner identity and live location with customer

Start ETA calculation and tracking subscription

State: PARTNER_ARRIVED

Caused by:

Partner (arrival confirmation)

Allowed transitions:

TRIP_STARTED →

→ CANCELLED

Disallowed transitions:

→ TRIP_COMPLETED

Backend responsibility:

Geofence Validation - validate proximity to pickup location

Notify customer of arrival

Start waiting-time billing logic after the grace period

Continue to track live location at higher fidelity

State: TRIP_STARTED

Triggered by:

Partner (OTP verification / explicit start action)

Allowed transitions:

TRIP_COMPLETED →

→ CANCELLED emergency only

Disallowed Transitions:

→ searching

→ PARTNER_ASSIGNED

Backend responsibility:

Record actual start time of trip and coordinates

Enable high-frequency location ingestion

Switch to a time + distance-based pricing model

Persist route breadcrumbs for auditing and dispute resolution

Status: TRIP_COMPLETED

Triggered by:

Partner

Allowed transitions:

Terminal state

Disallowed transitions:

Any further transitions

Backend responsibility:

Calculate final fare (distance, duration, wait, surge)

process payment or mark pending

Release partner back to ONLINE state

Archive ride data for reporting and compliance

Status: CANCELLED

Triggered by:

Customer

Partner

System timeouts, failures

allowed transitions:

Terminal state

Disallowed Transitions:

Any further transitions

Backend responsibility:

Determine cancellation fee - based on state + timing

Notify counterparty

Release the partner lock, if any.

Persist cancellation reason & timestamps for audit

Part 2: Real-time Location Tracking Logic

Partner Goes Online

Partner establishes a persistent real-time connection

Sends low-frequency location updates (battery-optimized) Backend updates geospatial index for discovery No ride association at this stage

After Accepting a Ride / During Pickup / During Trip

Location updates are sent via a real-time channel

Update frequency increases once a ride is assigned

Each update contains:

Coordinates

Timestamp

Speed, heading, accuracy (if available)

Backend behavior:

Immediately broadcasts latest valid location to subscribed clients

Appends validated points to an append-only location log

Maintains “last known location” cache per ride

After Trip Completion

High-frequency tracking stops

Final location is persisted

Partner reverts to idle tracking mode

Live subscription for the ride is closed

Handling “Last Known Location”

If live updates stop beyond a defined threshold:

Backend serves the most recent valid coordinate with timestamp

Clients stop interpolating movement

Location is marked as stale but preserved for continuity

No speculative movement is shown

Part 3: Failure & Edge-Case Handling
Partner Loses Internet During Active Ride

System behavior:

Ride is NOT auto-cancelled immediately

Backend enters a grace period (configurable)

Customer is informed that connection is weak, not that ride ended

Partner device:

Caches GPS points locally with timestamps

Uploads buffered points upon reconnection

Backend on reconnection:

Uses buffered points for accurate fare calculation

Broadcasts only the latest valid location for UI continuity

GPS Freezes or Sudden Jumps

Filtering strategy:

Discard points implying unrealistic speed

Ignore points with poor accuracy

Detect frozen coordinates despite motion indicators

System action:

Broadcast only validated, sanitized points

Apply map-matching when necessary

Preserve raw data internally for audit without exposing it live

Customer App Backgrounded or Killed

Expected behavior:

Real-time connection drops due to OS restrictions

Recovery:

On app resume, client fetches current ride snapshot

Backend returns:

Ride state

Partner details

Latest valid location

Client re-joins real-time channel seamlessly

Socket Disconnects and Reconnects

Design principle:

Real-time channels are stateless and recoverable

Client behavior:

Automatic reconnection enabled

On reconnect, client re-subscribes using ride identifier

Backend behavior:

Idempotent subscription handling

No state mutation based solely on socket events

Part 4: Cancellation + Tracking Interaction
Scenario A: Customer Cancels While Partner Is En Route

Backend:

Transition ride to CANCELLED

Stop ride-specific tracking subscriptions

Release partner immediately

Tracking:

Live updates stop instantly

Historical path up to cancellation is preserved

Admin view:

Ride marked cancelled

Partial route visible for audit and fairness checks

Scenario B: Partner Cancels During Pickup

Backend:

Transition to CANCELLED

Record cancellation reason (e.g., breakdown)

Optionally re-dispatch (policy-driven)

Tracking:

Partner location removed from customer view

No further live tracking

Admin view:

Cancellation reason logged

No fare charged unless waiting policy applies

Ride remains auditable with timestamps

Data Consistency Summary

Source of Truth: Backend database

Ephemeral: Real-time socket streams

Persistent: Ride state, timestamps, route logs, billing data

The system is designed to degrade gracefully, preserve financial and audit correctness, and never rely on real-time signals as authoritative state.

After Accepting Ride / During Pickup / During Trip

Location updates are delivered over a real-time channel

Update frequency increases when a ride has been assigned

Each update includes:

Coordonnées

Timestamp:

Speed, heading, accuracy if available

Backend behavior:

Immediately broadcasts the newest valid location to subscribed clients

Appends the validated points to an append-only location log

Maintains "last known location" cache per ride

After Trip Completion

High-frequency tracking stops

Final location is persisted

Partner switches back to idle tracking mode

Live subscription for the ride is closed.

“Last Known Location” Handling

If live updates stop beyond a defined threshold:

Backend serves the latest valid coordinate with timestamp

Clients stop interpolating movement

Location marked as stale, but kept for continuity

No speculative movement is shown.

Part 3: Failure & Edge Case Handling

Partner Loses Internet during Active Ride

System behavior

Ride is NOT auto-cancelled immediately

Backend enters grace period (configurable)

Customer informed that connection is weak, not that the ride has ended.

Partner device:

Caches GPS points with timestamps locally

Uploads buffered points upon reconnection

Backend upon re-connection:

Uses buffered points to accurately calculate fare.

Broadcasts only the latest valid location for UI continuity

GPS Freezes or Sudden Jumps

Filtering strategy:

Discard points that imply unrealistic speeds.

Ignore points with poor accuracy

Detect frozen coordinates despite motion indicators

System Action:

Broadcast only validated, sanitized points

Apply map-matching where appropriate

Keep raw data for audit purposes internally without exposing it live.

Customer App Backgrounded or Killed

Expected behavior:

Real-time connection drops due to OS restrictions.

Recovery

Upon app resume, client fetches current ride snapshot

Backend returns:

Ride State

Partner details

Latest valid location

Client rejoins real-time channel seamlessly

Socket Disconnects and Reconnects

Design principle:

Real-time channels are stateless and recoverable.

Client behaviour:

Automatic reconnection enabled

On reconnect - client re-subscribes using ride identifier

Backend Behavior:

Idempotent Subscription Handling

No state mutations solely on socket events

Part 4: Cancellation + Tracking Interaction

Scenario A: Customer Cancellation When Partner En Route

Backend:

Transition ride to CANCELLED

Stop ride-specific tracking subscriptions

Release partner immediately

Tracking

Live updates stop immediately

Historical path up to cancellation preserved

Admin view:

ride marked cancelled

Partial route visible for audit and fairness checks

Scenario B: Partner Cancels during Pickup

Backend:

Transition to CANCELLED

Record reason for cancellation, eg breakdown

Optionally redispatch (policy-driven)

Tracking

Partner location removed from customer view

No further live tracking

Admin view:

Cancellation reason logged

No fare charged, unless waiting policy applies

Ride remains auditable with timestamps

Data Consistency Summary

Source of Truth : Backend database Ephemeral: real-time socket streams Persistent: Ride state, timestamps, route logs, billing data ?.