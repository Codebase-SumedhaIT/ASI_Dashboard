const chokidar = require('chokidar');
const fs = require('fs');
const path = require('path');

// This module sets up Socket.IO log streaming for the server
// Emits new log lines to all connected clients efficiently
module.exports = function setupSocket(io, logger) {
  const logFile = path.resolve(__dirname, '../logs/logs.log');

  // Track last read position for incremental reading
  let lastSize = 0;

  // On new client connection
  io.on('connection', (socket) => {
    logger.info('New client connected to log stream', 'socket');
    socket.on('disconnect', () => {
      logger.info('Client disconnected from log stream', 'socket');
    });
  });

  // Watch the log file for changes using chokidar
  chokidar.watch(logFile, { persistent: true, usePolling: true, interval: 1000 })
    .on('change', (filePath) => {
      fs.stat(logFile, (err, stats) => {
        if (err) return logger.error('Error stating log file: ' + err, 'socket');
        if (stats.size > lastSize) {
          // Read only the new data
          const stream = fs.createReadStream(logFile, {
            start: lastSize,
            end: stats.size
          });
          let leftover = '';
          stream.on('data', (data) => {
            const lines = (leftover + data.toString()).split('\n');
            leftover = lines.pop();
            lines.forEach(line => {
              if (line.trim()) io.emit('log', line);
            });
          });
          stream.on('end', () => {
            lastSize = stats.size;
          });
        }
      });
    })
    .on('error', error => logger.error('Chokidar error: ' + error, 'socket'));

  // Initialize lastSize to current file size on startup
  fs.stat(logFile, (err, stats) => {
    if (!err && stats) lastSize = stats.size;
  });
}; 