const express = require('express');
const cors = require('cors');
require('dotenv').config();
const http = require('http');
const socketIo = require('socket.io');
const fs = require('fs');
const chokidar = require('chokidar'); // Added for efficient file watching
const helmet = require('helmet');
const compression = require('compression');

const { testConnection } = require('./config/database');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const dataRoutes = require('./routes/data');
const duplicateErrorsRoutes = require('./routes/duplicateErrors');
const FileWatcher = require('./utils/fileWatcher');
const dvDataRoute = require('./routes/dvData');
const adminRoutes = require('./routes/admin');
const logger = require('./utils/logger');

const app = express();
const PORT = process.env.PORT || 5000;
const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: process.env.CORS_ORIGIN, methods: ['GET', 'POST'] } });

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from uploads directory
app.use('/uploads', express.static('uploads'));

// Test database connection
testConnection();

// Initialize file watcher
const { pool } = require('./config/database');
const fileWatcher = new FileWatcher(pool);

// Start file watcher
fileWatcher.startWatching().then(() => {
  logger.info('File watcher initialized successfully', 'server');
}).catch(error => {
  console.error('❌ Error initializing file watcher:', error);
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/data', dataRoutes);
app.use('/api/data/duplicates', duplicateErrorsRoutes); // changed from '/api/data'
app.use('/api/dv-data', dvDataRoute);
app.use('/api/admin', adminRoutes);

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ message: 'EDA Dashboard API is running', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Environment variable validation
const requiredEnv = ['PORT', 'CORS_ORIGIN', 'DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
const missingEnv = requiredEnv.filter(key => !process.env[key]);
if (missingEnv.length) {
  console.error('❌ Missing required environment variables:', missingEnv.join(', '));
  process.exit(1);
}

// --- Socket.IO and Log Streaming Modularization ---
const setupSocket = require('./utils/socket'); // New module for socket and log streaming
setupSocket(io, logger);

// Graceful shutdown logic
function shutdown() {
  server.close(() => {
    logger.info('Server closed', 'server');
    // Close database pool
    if (pool && pool.end) {
      pool.end(() => logger.info('Database pool closed', 'server'));
    }
    // Stop file watcher if possible
    if (fileWatcher && fileWatcher.stopWatching) {
      fileWatcher.stopWatching().then(() => logger.info('File watcher stopped', 'server'));
    }
    process.exit(0);
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

server.listen(PORT, () => {
  logger.info('Server started and listening for connections', 'server');
  console.log(`🚀 Server with WebSocket running on port ${PORT}`);
  console.log(`📊 EDA Dashboard API: http://localhost:${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
});