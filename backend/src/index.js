require('dotenv').config();

const express      = require('express');
const cors         = require('cors');
const connectDB    = require('./config/db');
const uploadRoutes = require('./routes/upload');
const adminRoutes  = require('./routes/admin');
const chatRoutes   = require('./routes/chat');

const app  = express();
const PORT = process.env.PORT || 5000;

connectDB();

// ── Request timing middleware ────────────────────────────────────────────────
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const ms = Date.now() - start;
    if (ms > 2000) {
      console.log(`⚠️  Slow request: ${req.method} ${req.path} — ${ms}ms`);
    }
  });
  next();
});

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'x-admin-key'],
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/api/upload', uploadRoutes);
app.use('/api/admin',  adminRoutes);
app.use('/api/chat',   chatRoutes);

// ── Health check with full system status ─────────────────────────────────────
app.get('/health', async (req, res) => {
  const mongoose = require('mongoose');
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';

  res.json({
    status:    'ok',
    version:   '1.0.0',
    week:      'Week 4 - Production Ready',
    db:        dbStatus,
    uptime:    Math.floor(process.uptime()) + 's',
    memory:    Math.floor(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB',
    time:      new Date().toISOString(),
  });
});

// ── Global error handler ──────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('❌ Unhandled error:', err.message);
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'File too large. Maximum 50MB.' });
  }
  if (err.message === 'Only PDF files are allowed') {
    return res.status(400).json({ error: err.message });
  }
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

app.listen(PORT, () => {
  console.log('\n🧠 OpsMind AI — v1.0.0');
  console.log(`   Running on : http://localhost:${PORT}`);
  console.log(`   Health     : http://localhost:${PORT}/health`);
  console.log(`   Week       : 4 - Production Ready\n`);
});