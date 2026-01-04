import { nanoid } from 'nanoid';
import db, { partnerQueries, customerQueries, rideQueries, cancellationQueries, transitionQueries } from './index.js';

console.log('🌱 Seeding database with Vijayawada data...');

const now = Date.now();

const customers = [
  { id: 'customer1', name: 'Rajesh Kumar', phone: '+919876543210', email: 'rajesh@example.com', avatar: null },
  { id: 'customer2', name: 'Priya Sharma', phone: '+919876543211', email: 'priya@example.com', avatar: null },
  { id: 'customer3', name: 'Venkat Rao', phone: '+919876543212', email: 'venkat@example.com', avatar: null },
];

for (const c of customers) {
  try {
    customerQueries.create.run(c.id, c.name, c.phone, c.email, c.avatar, 4.8, 0, now);
    console.log(`✅ Created customer: ${c.name}`);
  } catch (e) {
    console.log(`⏭️  Customer ${c.name} already exists`);
  }
}

const partners = [
  { id: 'partner1', name: 'Krishna Murthy', phone: '+919555000001', email: 'krishna@drivers.com', vehicleNumber: 'AP39 TA 1234', vehicleModel: 'Maruti Dzire', vehicleColor: 'White' },
  { id: 'partner2', name: 'Ravi Teja', phone: '+919555000002', email: 'ravi@drivers.com', vehicleNumber: 'AP39 TB 5678', vehicleModel: 'Mahindra Auto', vehicleColor: 'Yellow' },
  { id: 'partner3', name: 'Suresh Babu', phone: '+919555000003', email: 'suresh@drivers.com', vehicleNumber: 'AP39 TC 9012', vehicleModel: 'Honda City', vehicleColor: 'Silver' },
  { id: 'partner4', name: 'Nagaraju', phone: '+919555000004', email: 'nagaraju@drivers.com', vehicleNumber: 'AP39 TD 3456', vehicleModel: 'TVS Auto', vehicleColor: 'Green' },
  { id: 'partner5', name: 'Ramesh Reddy', phone: '+919555000005', email: 'ramesh@drivers.com', vehicleNumber: 'AP39 TE 7890', vehicleModel: 'Hyundai Verna', vehicleColor: 'Black' },
];

for (const p of partners) {
  try {
    partnerQueries.create.run(
      p.id, p.name, p.phone, p.email, null,
      p.vehicleNumber, p.vehicleModel, p.vehicleColor,
      4.5 + Math.random() * 0.5,
      Math.floor(Math.random() * 500),
      'OFFLINE',
      now
    );
    console.log(`✅ Created partner: ${p.name}`);
  } catch (e) {
    console.log(`⏭️  Partner ${p.name} already exists`);
  }
}

const historicalRides = [
  {
    id: 'ride-hist-001',
    customerId: 'customer1',
    partnerId: 'partner1',
    state: 'TRIP_COMPLETED',
    pickup: { address: 'Benz Circle, Vijayawada', lat: 16.5062, lng: 80.6480 },
    dropoff: { address: 'Railway Station, Vijayawada', lat: 16.5175, lng: 80.6199 },
    fare: 85,
    distanceKm: 4.2,
    durationMinutes: 15,
    createdAt: now - 86400000 * 5,
  },
  {
    id: 'ride-hist-002',
    customerId: 'customer2',
    partnerId: 'partner2',
    state: 'TRIP_COMPLETED',
    pickup: { address: 'MG Road, Vijayawada', lat: 16.5100, lng: 80.6400 },
    dropoff: { address: 'Kanaka Durga Temple', lat: 16.5152, lng: 80.6093 },
    fare: 95,
    distanceKm: 5.5,
    durationMinutes: 20,
    createdAt: now - 86400000 * 4,
  },
  {
    id: 'ride-hist-003',
    customerId: 'customer1',
    partnerId: 'partner3',
    state: 'CANCELLED',
    pickup: { address: 'PNBS, Vijayawada', lat: 16.5193, lng: 80.6305 },
    dropoff: { address: 'Patamata, Vijayawada', lat: 16.4980, lng: 80.6650 },
    createdAt: now - 86400000 * 3,
  },
  {
    id: 'ride-hist-004',
    customerId: 'customer3',
    partnerId: 'partner1',
    state: 'TRIP_COMPLETED',
    pickup: { address: 'Auto Nagar, Vijayawada', lat: 16.4850, lng: 80.6180 },
    dropoff: { address: 'Benz Circle, Vijayawada', lat: 16.5062, lng: 80.6480 },
    fare: 120,
    distanceKm: 8.0,
    durationMinutes: 28,
    createdAt: now - 86400000 * 2,
  },
  {
    id: 'ride-hist-005',
    customerId: 'customer2',
    partnerId: 'partner4',
    state: 'CANCELLED',
    pickup: { address: 'Governorpet, Vijayawada', lat: 16.5080, lng: 80.6200 },
    dropoff: { address: 'PNBS, Vijayawada', lat: 16.5193, lng: 80.6305 },
    createdAt: now - 86400000 * 2,
  },
  {
    id: 'ride-hist-006',
    customerId: 'customer1',
    partnerId: 'partner2',
    state: 'TRIP_COMPLETED',
    pickup: { address: 'Railway Station, Vijayawada', lat: 16.5175, lng: 80.6199 },
    dropoff: { address: 'MG Road, Vijayawada', lat: 16.5100, lng: 80.6400 },
    fare: 65,
    distanceKm: 3.2,
    durationMinutes: 12,
    createdAt: now - 86400000,
  },
  {
    id: 'ride-hist-007',
    customerId: 'customer3',
    partnerId: 'partner5',
    state: 'TRIP_COMPLETED',
    pickup: { address: 'Kanaka Durga Temple', lat: 16.5152, lng: 80.6093 },
    dropoff: { address: 'Patamata, Vijayawada', lat: 16.4980, lng: 80.6650 },
    fare: 145,
    distanceKm: 10.5,
    durationMinutes: 35,
    createdAt: now - 43200000,
  },
];

for (const ride of historicalRides) {
  try {
    const createdAt = ride.createdAt;
    const updatedAt = createdAt + (ride.durationMinutes || 10) * 60000;

    rideQueries.create.run(
      ride.id,
      ride.customerId,
      ride.state,
      ride.pickup.address,
      ride.pickup.lat,
      ride.pickup.lng,
      ride.dropoff.address,
      ride.dropoff.lat,
      ride.dropoff.lng,
      createdAt,
      updatedAt
    );

    if (ride.partnerId) {
      db.prepare(`UPDATE rides SET partner_id = ? WHERE id = ?`).run(ride.partnerId, ride.id);
    }

    if (ride.state === 'TRIP_COMPLETED') {
      rideQueries.complete.run(updatedAt, updatedAt, ride.fare, ride.distanceKm, ride.durationMinutes, ride.id);

      transitionQueries.create.run(ride.id, null, 'REQUESTED', 'customer', createdAt);
      transitionQueries.create.run(ride.id, 'REQUESTED', 'SEARCHING', 'system', createdAt + 1000);
      transitionQueries.create.run(ride.id, 'SEARCHING', 'PARTNER_ASSIGNED', 'partner', createdAt + 30000);
      transitionQueries.create.run(ride.id, 'PARTNER_ASSIGNED', 'PARTNER_ARRIVED', 'partner', createdAt + 300000);
      transitionQueries.create.run(ride.id, 'PARTNER_ARRIVED', 'TRIP_STARTED', 'partner', createdAt + 360000);
      transitionQueries.create.run(ride.id, 'TRIP_STARTED', 'TRIP_COMPLETED', 'partner', updatedAt);
    } else if (ride.state === 'CANCELLED') {
      rideQueries.cancel.run(updatedAt, ride.id);

      const reasons = ['CUSTOMER_CHANGED_MIND', 'PARTNER_NOT_RESPONDING', 'PARTNER_TOO_FAR'];
      const cancelledBy = Math.random() > 0.5 ? 'CUSTOMER' : 'PARTNER';
      const reason = reasons[Math.floor(Math.random() * reasons.length)];

      cancellationQueries.create.run(nanoid(), ride.id, cancelledBy, reason, null, updatedAt);

      transitionQueries.create.run(ride.id, null, 'REQUESTED', 'customer', createdAt);
      transitionQueries.create.run(ride.id, 'REQUESTED', 'SEARCHING', 'system', createdAt + 1000);
      transitionQueries.create.run(ride.id, 'SEARCHING', 'CANCELLED', cancelledBy.toLowerCase(), updatedAt);
    }

    console.log(`✅ Created historical ride: ${ride.id} (${ride.state})`);
  } catch (e) {
    console.log(`⏭️  Ride ${ride.id} already exists`);
  }
}

console.log('\n✨ Database seeding complete with Vijayawada data!');
console.log(`   - ${customers.length} customers`);
console.log(`   - ${partners.length} partners`);
console.log(`   - ${historicalRides.length} historical rides`);
