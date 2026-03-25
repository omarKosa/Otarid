require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const path = require('path');
const fs = require('fs');

const { connectDB } = require('../Otarid/src/config/database');
const authRoutes = require('./routes/authRoutes');
const profileRoutes = require('../Otarid/src/routes/profileRoutes');
const { errorHandler } = require('../Otarid/src/middleware/errorHandler');
const logger = require('../Otarid/src/utils/logger');

// Load models and relations
require('./models/relations');

const app = express();

// Connect to PostgreSQL (auto-syncs tables in dev)
connectDB();

// Ensure uploads folder exists
const uploadDir = process.env.UPLOAD_PATH || './uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Security
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}));

// General middleware
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// HTTP request logging
if (process.env.NODE_ENV === 'development') {
  app.use(
    morgan('dev', {
      stream: {
        write: (message) => logger.http(message.trim()),
      },
    })
  );
}

// Serve uploaded avatars as static files
app.use('/uploads', express.static(path.resolve(uploadDir)));

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/profile', profileRoutes);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ success: true, status: 'healthy', timestamp: new Date().toISOString() });
});

// 404
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found.` });
});

// Global error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  logger.info('Server started', {
    mode: process.env.NODE_ENV,
    port: PORT,
    apiBaseUrl: `http://localhost:${PORT}/api/v1`,
  });
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => process.exit(0));
});

module.exports = app;
