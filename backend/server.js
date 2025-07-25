const express = require('express');
const cors = require('cors');
require('dotenv').config();
const http = require('http');
const socketIo = require('socket.io');
const fs = require('fs');

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
const io = socketIo(server, { cors: { origin: '*', methods: ['GET', 'POST'] } });

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
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
  console.log('📁 File watcher initialized successfully');
}).catch(error => {
  console.error('❌ Error initializing file watcher:', error);
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/data', dataRoutes);
app.use('/api/data', duplicateErrorsRoutes);
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

// Real-time log streaming via socket.io
const logFile = './backend/logs/logs.log';
let lastSize = 0;

const clients = [];

io.on('connection', (socket) => {
  clients.push(socket);
  socket.on('disconnect', () => {
    const idx = clients.indexOf(socket);
    if (idx !== -1) clients.splice(idx, 1);
  });
});

// Override console.log and console.error to emit to socket.io clients
const origLog = console.log;
const origError = console.error;

console.log = function (...args) {
  origLog.apply(console, args);
  const msg = args.map(String).join(' ');
  clients.forEach(socket => socket.emit('log', msg));
};

console.error = function (...args) {
  origError.apply(console, args);
  const msg = args.map(String).join(' ');
  clients.forEach(socket => socket.emit('log', msg));
};

fs.watchFile(logFile, { interval: 1000 }, (curr, prev) => {
  if (curr.size > prev.size) {
    const stream = fs.createReadStream(logFile, {
      start: prev.size,
      end: curr.size
    });
    let leftover = '';
    stream.on('data', (data) => {
      const lines = (leftover + data.toString()).split('\n');
      leftover = lines.pop();
      lines.forEach(line => io.emit('log', line));
    });
  }
});

server.listen(PORT, () => {
  logger.info('Server started and listening for connections', 'server');
  console.log(`🚀 Server with WebSocket running on port ${PORT}`);
  console.log(`📊 EDA Dashboard API: http://localhost:${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
});