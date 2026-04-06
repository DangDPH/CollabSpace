const express = require('express');
const http    = require('http');
const { Server } = require('socket.io');
const initializeSocket = require('./socket/index');

const app    = express();
const server = http.createServer(app);

// ── CORS Configuration ──────────────────────────────────────────
// Reads ALLOWED_ORIGINS from env var (comma-separated) or defaults to "*"
const rawOrigins = (process.env.ALLOWED_ORIGINS || '*').trim();
const corsOrigin = rawOrigins === '*' ? '*' : rawOrigins.split(',').map(o => o.trim());

const io = new Server(server, {
  cors: {
    origin: corsOrigin,
    methods: ['GET', 'POST'],
  },
});

app.use(express.json());

// Health check
app.get('/health', (_req, res) => res.json({ status: 'ok', uptime: process.uptime() }));

// Attach all Socket.IO handlers
initializeSocket(io);

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(` Real-time server running on port ${PORT}`);
  console.log(` CORS origins: ${JSON.stringify(corsOrigin)}`);
});
