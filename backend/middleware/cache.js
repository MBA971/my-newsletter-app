/**
 * Caching middleware for common API endpoints
 */

import { cache } from '../utils/cache.js';

// Cache middleware for GET requests
export const cacheMiddleware = (keyGenerator, ttl = null) => {
  return async (req, res, next) => {
    // Generate cache key based on request
    const cacheKey = typeof keyGenerator === 'function'
      ? keyGenerator(req)
      : keyGenerator;

    if (!cacheKey) {
      return next();
    }

    // Try to get from cache
    const cachedData = await cache.get(cacheKey);
    if (cachedData) {
      console.log(`🎯 Cache HIT for key: ${cacheKey}`);
      return res.json(cachedData);
    }

    console.log(`❌ Cache MISS for key: ${cacheKey}`);

    // If not in cache, continue to route handler
    // Store the original res.json method to intercept the response
    const originalJson = res.json;
    res.json = function(data) {
      // Cache the response data
      if (data) {
        cache.set(cacheKey, data, ttl).catch(err => {
          console.error('Cache set error:', err);
        });
      }
      // Call the original json method
      originalJson.call(this, data);
    };

    next();
  };
};

// Cache middleware specifically for news data
export const newsCacheMiddleware = (ttl = 300) => { // 5 minutes default
  return cacheMiddleware((req) => {
    const { domain, archived, includeArchived, q, limit, offset } = req.query;
    const userId = req.user ? req.user.userId : 'anonymous';

    // Create cache key based on request parameters
    const params = [];
    if (domain) params.push(`domain:${domain}`);
    if (archived !== undefined) params.push(`archived:${archived}`);
    if (includeArchived !== undefined) params.push(`includeArchived:${includeArchived}`);
    if (q) params.push(`q:${q}`);
    if (limit) params.push(`limit:${limit}`);
    if (offset) params.push(`offset:${offset}`);

    const paramsStr = params.length > 0 ? '?' + params.join('&') : '';
    return `news:${userId}:${paramsStr}`;
  }, ttl);
};

// Cache middleware for domain data
export const domainCacheMiddleware = (ttl = 3600) => { // 1 hour default
  return cacheMiddleware((req) => {
    return `domains:all`;
  }, ttl);
};

// Cache middleware for user data
export const userCacheMiddleware = (ttl = 900) => { // 15 minutes default
  return cacheMiddleware((req) => {
    const userId = req.user ? req.user.userId : 'anonymous';
    return `users:${userId}`;
  }, ttl);
};

// Clear cache for specific keys
export const clearCache = async (pattern) => {
  // This is a simplified version - in a real implementation we might want to use KEYS or SCAN
  // For now, we'll use a more specific clearing approach
  if (pattern.includes('*')) {
    // For patterns with wildcards, we'd need to implement a more complex clearing mechanism
    console.warn('Wildcard cache clearing not implemented for security reasons');
    return;
  }

  await cache.del(pattern);
};

// Invalidate cache after mutations
export const invalidateCache = async (keys) => {
  if (Array.isArray(keys)) {
    for (const key of keys) {
      await cache.del(key);
    }
  } else {
    await cache.del(keys);
  }
};

export default {
  cacheMiddleware,
  newsCacheMiddleware,
  domainCacheMiddleware,
  userCacheMiddleware,
  clearCache,
  invalidateCache
};