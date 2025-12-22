import { createClient } from 'redis';
import config from '../config/config.js';

// Track connection status and last error log time
let isConnected = false;
let lastErrorLogTime = 0;
const ERROR_LOG_THROTTLE = 60000; // Log error at most once per minute

// Create Redis client
const redisClient = createClient({
  url: config.redis.url,
  socket: {
    reconnectStrategy: (retries) => {
      // Exponential backoff with a cap of 30 seconds
      const delay = Math.min(retries * 500, 30000);
      return delay;
    }
  }
});

// Handle Redis connection events
redisClient.on('connect', () => {
  console.log('✅ Connected to Redis');
  isConnected = true;
});

redisClient.on('ready', () => {
  console.log('🚀 Redis client ready');
  isConnected = true;
});

redisClient.on('end', () => {
  console.log('🔌 Redis connection closed');
  isConnected = false;
});

redisClient.on('error', (err) => {
  const now = Date.now();
  if (now - lastErrorLogTime > ERROR_LOG_THROTTLE) {
    console.warn('⚠️  Redis Client Status:', err.message || 'Connecting...');
    lastErrorLogTime = now;
  }
  isConnected = false;
});

// Connect to Redis (non-blocking)
const connectRedis = async () => {
  try {
    await redisClient.connect();
  } catch (err) {
    // Connection errors are handled by the 'error' event listener above
  }
};

connectRedis();

// Graceful shutdown
process.on('SIGINT', async () => {
  if (isConnected) {
    console.log('\n shutting down gracefully...');
    await redisClient.quit();
  }
  process.exit(0);
});

// Cache utility functions
export const cache = {
  // Get value from cache
  get: async (key) => {
    if (!isConnected) return null;
    try {
      const prefixedKey = config.redis.prefix + key;
      const value = await redisClient.get(prefixedKey);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  },

  // Set value in cache
  set: async (key, value, expiration = config.redis.ttl) => { // Use config TTL as default
    if (!isConnected) return;
    try {
      const prefixedKey = config.redis.prefix + key;
      await redisClient.setEx(prefixedKey, expiration, JSON.stringify(value));
    } catch (error) {
      console.error('Cache set error:', error);
    }
  },

  // Delete value from cache
  del: async (key) => {
    if (!isConnected) return;
    try {
      const prefixedKey = config.redis.prefix + key;
      await redisClient.del(prefixedKey);
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  },

  // Check if key exists in cache
  exists: async (key) => {
    if (!isConnected) return false;
    try {
      const prefixedKey = config.redis.prefix + key;
      const result = await redisClient.exists(prefixedKey);
      return result === 1;
    } catch (error) {
      console.error('Cache exists error:', error);
      return false;
    }
  },

  // Clear all cache
  flushAll: async () => {
    if (!isConnected) return;
    try {
      await redisClient.flushAll();
    } catch (error) {
      console.error('Cache flush error:', error);
    }
  }
};

export default cache;