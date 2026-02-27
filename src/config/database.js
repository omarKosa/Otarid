const { Sequelize } = require('sequelize');
const logger = require('../utils/logger');

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    dialect: 'postgres',
    logging:
      process.env.NODE_ENV === 'development'
        ? (msg) => logger.debug(msg, { source: 'sequelize' })
        : false,
    dialectOptions:
      process.env.DB_SSL === 'true'
        ? { ssl: { require: true, rejectUnauthorized: false } }
        : {},
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  }
);

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    logger.info('PostgreSQL connected successfully.', {
      host: process.env.DB_HOST || 'localhost',
      database: process.env.DB_NAME,
    });

    // Auto-create/update tables in development
    if (process.env.NODE_ENV !== 'production') {
      await sequelize.sync({ alter: true });
      logger.info('Database models synced.');
    }
  } catch (error) {
    logger.error('PostgreSQL connection error', {
      error: error.message,
    });
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };
