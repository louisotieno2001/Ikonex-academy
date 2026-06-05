require('dotenv').config();

const config = {
  port: parseInt(process.env.API_PORT || process.env.BACKEND_PORT, 10) || 9002,
  nodeEnv: process.env.NODE_ENV || 'development',
  baseUrl: process.env.API_URL || `http://localhost:${parseInt(process.env.API_PORT, 10) || 9002}`,

  directus: {
    url: process.env.DIRECTUS_URL || 'http://localhost:9000',
    token: process.env.DIRECTUS_TOKEN,
  },

  jwt: {
    secret: process.env.JWT_SECRET,
    accessExpiry: process.env.JWT_EXPIRES_IN || '15m',
    refreshExpiry: '7d',
    issuer: 'ikonex-academy-api',
  },

  cors: {
    origin: process.env.CORS_ORIGIN 
      ? process.env.CORS_ORIGIN.split(',').filter(o => o.trim() !== '').map(o => o.trim())
      : ['http://localhost:9001'],
  },

  bcrypt: {
    saltRounds: 12,
  },
};

const requiredKeys = ['directus.token', 'jwt.secret'];
for (const key of requiredKeys) {
  const val = key.split('.').reduce((o, k) => o && o[k], config);
  if (!val) {
    throw new Error(`Missing required config: ${key}`);
  }
}

module.exports = config;
