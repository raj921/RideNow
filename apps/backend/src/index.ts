import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import type {
  ServerToClientEvents,
  ClientToServerEvents,
  InterServerEvents,
  SocketData,
} from '@ride-hailing/shared-types';
import routes from './routes/index.js';
import { setupSocketHandlers } from './socket/handlers.js';

const app = express();
const httpServer = createServer(app);

// Socket.IO server with typed events
const io = new Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>(
  httpServer,
  {
    cors: {
      origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', 'http://localhost:5173', 'http://localhost:8081', 'http://localhost:19006'],
      methods: ['GET', 'POST'],
    },
  }
);

// Middleware
app.use(cors());
app.use(express.json());

// API routes
app.use('/api', routes);

// Setup socket handlers
setupSocketHandlers(io);

// Start server
const PORT = process.env.PORT || 4000;

httpServer.listen(PORT, () => {
  console.log(`
🚗 Ride-Hailing Backend Server
================================
🌐 REST API: http://localhost:${PORT}/api
🔌 Socket.IO: ws://localhost:${PORT}
📊 Health: http://localhost:${PORT}/api/health

Available endpoints:
  GET  /api/health
  GET  /api/rides
  GET  /api/rides/active
  GET  /api/rides/:id
  POST /api/rides
  POST /api/rides/:id/cancel
  GET  /api/partners
  GET  /api/partners/online
  GET  /api/customers
  GET  /api/cancellations
  GET  /api/stats/rides
  GET  /api/stats/cancellations
  `);
});

export { io };

