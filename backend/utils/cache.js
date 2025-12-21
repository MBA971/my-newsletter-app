/**
 * Redis cache utility
 */

import { createClient } from 'redis';
import config from '../config/config.js';

// Create Redis client
const redisClient = createClient({
  url: config.redis.url,
  retry_strategy: (times) => {
    // Retry after 1, 2, 4, 8 seconds exponentially
    return Math.min(times * 1000, 8000);
  }
});

// Handle Redis connection events
redisClient.on('connect', () => {
  console.log('✅ Connected to Redis');
});

redisClient.on('error', (err) => {
  console.error('❌ Redis Client Error:', err);
});

// Connect to Redis
await redisClient.connect();

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n shutting down gracefully...');
  await redisClient.quit();
  process.exit(0);
});

// Cache utility functions
export const cache = {
  // Get value from cache
  get: async (key) => {
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
    try {
      const prefixedKey = config.redis.prefix + key;
      await redisClient.setEx(prefixedKey, expiration, JSON.stringify(value));
    } catch (error) {
      console.error('Cache set error:', error);
    }
  },

  // Delete value from cache
  del: async (key) => {
    try {
      const prefixedKey = config.redis.prefix + key;
      await redisClient.del(prefixedKey);
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  },

  // Check if key exists in cache
  exists: async (key) => {
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
    try {
      await redisClient.flushAll();
    } catch (error) {
      console.error('Cache flush error:', error);
    }
  }
};

export default cache;