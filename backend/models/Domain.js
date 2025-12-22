/**
 * Domain model - handles all domain-related database operations
 */

import pool from '../utils/database.js';
import { cache } from '../utils/cache.js';

class DomainModel {
  /**
   * Find domain by ID
   */
  static async findById(id) {
    try {
      const cacheKey = `domain:id-${id}`;

      // Try to get from cache first
      let domain = await cache.get(cacheKey);
      if (domain) {
        console.log(`🎯 Domain by ID cache HIT for key: ${cacheKey}`);
        return domain;
      }

      console.log(`❌ Domain by ID cache MISS for key: ${cacheKey}`);

      const result = await pool.query(
        'SELECT id, name, color FROM domains WHERE id = $1',
        [id]
      );

      domain = result.rows[0] || null;

      // Cache the result for 1 hour if found
      if (domain) {
        await cache.set(cacheKey, domain, 3600);
      }

      return domain;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Find domain by name
   */
  static async findByName(name) {
    try {
      const result = await pool.query(
        'SELECT id, name, color FROM domains WHERE name = $1',
        [name]
      );
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get all domains
   */
  static async findAll() {
    try {
      const cacheKey = 'domains:all';

      // Try to get from cache first
      let domains = await cache.get(cacheKey);
      if (domains) {
        console.log(`🎯 All domains cache HIT for key: ${cacheKey}`);
        return domains;
      }

      console.log(`❌ All domains cache MISS for key: ${cacheKey}`);

      const result = await pool.query(
        'SELECT id, name, color FROM domains ORDER BY name ASC'
      );

      domains = result.rows;

      // Cache the result for 1 hour
      await cache.set(cacheKey, domains, 3600);

      return domains;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get all domains with article count
   */
  static async findAllWithArticleCount() {
    try {
      const cacheKey = 'domains:with-article-count';

      // Try to get from cache first
      let domains = await cache.get(cacheKey);
      if (domains) {
        console.log(`🎯 Domains with article count cache HIT for key: ${cacheKey}`);
        return domains;
      }

      console.log(`❌ Domains with article count cache MISS for key: ${cacheKey}`);

      const result = await pool.query(
        `SELECT d.*, COUNT(n.id) as article_count
         FROM domains d
         LEFT JOIN news n ON d.id = n.domain_id AND n.pending_validation = false AND n.archived = false
         GROUP BY d.id, d.name, d.color
         ORDER BY d.id`
      );

      domains = result.rows;

      // Cache the result for 15 minutes (shorter due to article count changing)
      await cache.set(cacheKey, domains, 900);

      return domains;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Create a new domain
   */
  static async create(domainData) {
    try {
      const { name, color } = domainData;

      const result = await pool.query(
        `INSERT INTO domains (name, color)
         VALUES ($1, $2)
         RETURNING id, name, color`,
        [name, color]
      );

      // Invalidate domain cache after creation
      await cache.del('domains:all');
      await cache.del('domains:with-article-count');

      return result.rows[0];
    } catch (error) {
      // Check for unique constraint violations
      if (error.code === '23505') { // PostgreSQL unique violation
        if (error.detail.includes('name')) {
          throw new Error('Domain name already exists');
        }
      }
      throw error;
    }
  }

  /**
   * Update domain by ID
   */
  static async update(id, domainData) {
    try {
      const { name, color } = domainData;
      const updates = [];
      const values = [];
      let valueIndex = 1;

      if (name !== undefined) {
        updates.push(`name = $${valueIndex}`);
        values.push(name);
        valueIndex++;
      }
      if (color !== undefined) {
        updates.push(`color = $${valueIndex}`);
        values.push(color);
        valueIndex++;
      }

      if (updates.length === 0) {
        throw new Error('No fields to update');
      }

      values.push(id); // Add ID for WHERE clause

      const query = `UPDATE domains SET ${updates.join(', ')} WHERE id = $${valueIndex} RETURNING id, name, color`;
      const result = await pool.query(query, values);

      if (result.rows.length === 0) {
        throw new Error('Domain not found');
      }

      // Invalidate domain cache after update
      await cache.del(`domain:id-${id}`);
      await cache.del('domains:all');
      await cache.del('domains:with-article-count');

      return result.rows[0];
    } catch (error) {
      // Check for unique constraint violations
      if (error.code === '23505') { // PostgreSQL unique violation
        if (error.detail.includes('name')) {
          throw new Error('Domain name already exists');
        }
      }
      throw error;
    }
  }

  /**
   * Delete domain by ID
   */
  static async delete(id) {
    try {
      const result = await pool.query(
        'DELETE FROM domains WHERE id = $1 RETURNING id',
        [id]
      );

      if (result.rows.length > 0) {
        // Invalidate domain cache after deletion
        await cache.del(`domain:id-${id}`);
        await cache.del('domains:all');
        await cache.del('domains:with-article-count');
      }

      return result.rows.length > 0;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Count total domains
   */
  static async count() {
    try {
      const result = await pool.query('SELECT COUNT(*) as count FROM domains');
      return parseInt(result.rows[0].count);
    } catch (error) {
      throw error;
    }
  }
}

export default DomainModel;