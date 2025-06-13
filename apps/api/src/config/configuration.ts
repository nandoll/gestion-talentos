export default () => ({
  // Puerto y entorno
  port: parseInt(process.env.PORT, 10) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',

  database: {
    url: process.env.DATABASE_URL,
  },

  // CORS
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:4200',
  },

  throttle: {
    ttl: parseInt(process.env.RATE_LIMIT_TTL, 10) || 60000,
    limit: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100,
  },

  logging: {
    level: process.env.LOG_LEVEL || 'debug',
  },
});
