require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');

const { connectDB } = require('./config/database');

// Load models before connecting to DB and syncing
const User = require('./models/User');

const authRoutes = require('./routes/authRoutes');
const internalRoutes = require('./routes/internalRoutes');
const { errorHandler } = require('./middleware/errorHandler');
const logger = require('./utils/logger');
const { connectPublisher } = require('./utils/publisher');

const app = express();

connectDB();

app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
  })
);

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

if (process.env.NODE_ENV === 'development') {
  app.use(
    morgan('dev', {
      stream: {
        write: (message) => logger.http(message.trim()),
      },
    })
  );
}

app.use('/api/auth', authRoutes);
app.use('/internal', internalRoutes);

app.get('/health', (req, res) => {
  res.status(200).json({ success: true, status: 'healthy', timestamp: new Date().toISOString() });
});

app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found.` });
});

app.use(errorHandler);

const PORT = process.env.PORT || 5001;
const server = app.listen(PORT, async () => {
  logger.info('Authentication service started', {
    mode: process.env.NODE_ENV,
    port: PORT,
    apiBaseUrl: `http://localhost:${PORT}/api/auth`,
  });

  try {
    await connectPublisher();
  } catch (err) {
    logger.warn('RabbitMQ publisher unavailable. Events will not be published until the connection is restored.', {
      error: err.message,
    });
  }
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => process.exit(0));
});

module.exports = app;
