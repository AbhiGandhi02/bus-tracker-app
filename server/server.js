const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { createServer } = require('http');
const { Server } = require('socket.io');
const connectDB = require('./config/db');
const admin = require('firebase-admin');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

// Initialize Firebase Admin
const serviceAccount = require('./serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// Route files
const authRoutes = require('./routes/auth');
const busMasterRoutes = require('./routes/busMaster');
const routeRoutes = require('./routes/routes');
const scheduledRideRoutes = require('./routes/scheduledRide');
const userRoutes = require('./routes/user');

const app = express();

// Body parser
app.use(express.json());

// Enable CORS
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));

// Create HTTP server
const httpServer = createServer(app);

// Initialize Socket.io
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

// Make io accessible to routes
app.set('io', io);

// Socket.io connection
io.on('connection', (socket) => {
  console.log(`✅ Client connected: ${socket.id}`);

  socket.on('subscribe-ride', (rideId) => {
    socket.join(`ride-${rideId}`);
    console.log(`📍 Client ${socket.id} subscribed to ride ${rideId}`);
  });

  socket.on('unsubscribe-ride', (rideId) => {
    socket.leave(`ride-${rideId}`);
    console.log(`📍 Client ${socket.id} unsubscribed from ride ${rideId}`);
  });

  socket.on('disconnect', () => {
    console.log(`❌ Client disconnected: ${socket.id}`);
  });
});

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/bus-master', busMasterRoutes);
app.use('/api/routes', routeRoutes);
app.use('/api/scheduled-rides', scheduledRideRoutes);
app.use('/api/users', userRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({
    message: '🚌 Bus Tracking API v2.0',
    version: '2.0.0',
    endpoints: {
      auth: '/api/auth',
      busMaster: '/api/bus-master',
      routes: '/api/routes',
      scheduledRides: '/api/scheduled-rides',
      users: '/api/users'
    }
  });
});

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🔌 WebSocket server ready`);
  console.log(`🔥 Firebase Admin initialized`);
});