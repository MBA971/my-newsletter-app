/**
 * User model - handles all user-related database operations
 */

import pool from '../utils/database.js';
import { sanitizeContent } from '../utils/validation.js';
import bcrypt from 'bcrypt';
import { cache } from '../utils/cache.js';

class UserModel {
  /**
   * Find user by email
   */
  static async findByEmail(email) {
    try {
      const cacheKey = `user:email-${email}`;

      // Try to get from cache first
      let user = await cache.get(cacheKey);
      if (user) {
        console.log(`🎯 User by email cache HIT for key: ${cacheKey}`);
        return user;
      }

      console.log(`❌ User by email cache MISS for key: ${cacheKey}`);

      const result = await pool.query(
        'SELECT id, username, email, password, role, domain_id, created_at FROM users WHERE email = $1',
        [email]
      );

      user = result.rows[0] || null;

      // Cache the result for 15 minutes if found
      if (user) {
        await cache.set(cacheKey, user, 900);
      }

      return user;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Find user by ID
   */
  static async findById(id) {
    try {
      const cacheKey = `user:id-${id}`;

      // Try to get from cache first
      let user = await cache.get(cacheKey);
      if (user) {
        console.log(`🎯 User by ID cache HIT for key: ${cacheKey}`);
        return user;
      }

      console.log(`❌ User by ID cache MISS for key: ${cacheKey}`);

      const result = await pool.query(
        'SELECT id, username, email, role, domain_id, created_at FROM users WHERE id = $1',
        [id]
      );

      user = result.rows[0] || null;

      // Cache the result for 15 minutes if found
      if (user) {
        await cache.set(cacheKey, user, 900);
      }

      return user;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Create a new user
   */
  static async create(userData, rounds = 12) {
    try {
      const { username, email, password, role = 'user', domain_id = null } = userData;

      // Hash the password
      const hashedPassword = await bcrypt.hash(password, rounds);

      const result = await pool.query(
        `INSERT INTO users (username, email, password, role, domain_id)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, username, email, role, domain_id, created_at`,
        [username, email, hashedPassword, role, domain_id]
      );

      // Invalidate user cache after creation
      await cache.del('users:all');
      if (domain_id) {
        await cache.del(`users:domain-${domain_id}`);
      }

      return result.rows[0];
    } catch (error) {
      // Check for unique constraint violations
      if (error.code === '23505') { // PostgreSQL unique violation
        if (error.detail.includes('email')) {
          throw new Error('Email already exists');
        } else if (error.detail.includes('username')) {
          throw new Error('Username already exists');
        }
      }
      throw error;
    }
  }

  /**
   * Update user by ID
   */
  static async update(id, userData) {
    try {
      const { username, email, password, role, domain_id } = userData;
      const updates = [];
      const values = [];
      let valueIndex = 1;

      if (username !== undefined) {
        updates.push(`username = $${valueIndex}`);
        values.push(username);
        valueIndex++;
      }
      if (email !== undefined) {
        updates.push(`email = $${valueIndex}`);
        values.push(email);
        valueIndex++;
      }
      if (password !== undefined) {
        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 12);
        updates.push(`password = $${valueIndex}`);
        values.push(hashedPassword);
        valueIndex++;
      }
      if (role !== undefined) {
        updates.push(`role = $${valueIndex}`);
        values.push(role);
        valueIndex++;
      }
      if (domain_id !== undefined) {
        updates.push(`domain_id = $${valueIndex}`);
        values.push(domain_id);
        valueIndex++;
      }

      if (updates.length === 0) {
        throw new Error('No fields to update');
      }

      values.push(id); // Add ID for WHERE clause

      const query = `UPDATE users SET ${updates.join(', ')} WHERE id = $${valueIndex} RETURNING id, username, email, role, domain_id, created_at`;
      const result = await pool.query(query, values);

      if (result.rows.length === 0) {
        throw new Error('User not found');
      }

      // Invalidate user cache after update
      await cache.del(`user:id-${id}`);
      // If email was updated, delete old email cache
      if (email !== undefined) {
        await cache.del(`user:email-${email}`);
      }
      await cache.del('users:all');
      if (domain_id) {
        await cache.del(`users:domain-${domain_id}`);
      }

      return result.rows[0];
    } catch (error) {
      // Check for unique constraint violations
      if (error.code === '23505') { // PostgreSQL unique violation
        if (error.detail.includes('email')) {
          throw new Error('Email already exists');
        } else if (error.detail.includes('username')) {
          throw new Error('Username already exists');
        }
      }
      throw error;
    }
  }

  /**
   * Delete user by ID
   */
  static async delete(id) {
    try {
      // First get the user to access their email for cache invalidation
      const userResult = await pool.query(
        'SELECT email, domain_id FROM users WHERE id = $1',
        [id]
      );

      const result = await pool.query(
        'DELETE FROM users WHERE id = $1 RETURNING id',
        [id]
      );

      if (result.rows.length > 0 && userResult.rows.length > 0) {
        // Invalidate user cache after deletion
        const user = userResult.rows[0];
        await cache.del(`user:id-${id}`);
        await cache.del(`user:email-${user.email}`);
        await cache.del('users:all');
        if (user.domain_id) {
          await cache.del(`users:domain-${user.domain_id}`);
        }
      }

      return result.rows.length > 0;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get all users
   */
  static async findAll() {
    try {
      const cacheKey = 'users:all';

      // Try to get from cache first
      let users = await cache.get(cacheKey);
      if (users) {
        console.log(`🎯 All users cache HIT for key: ${cacheKey}`);
        return users;
      }

      console.log(`❌ All users cache MISS for key: ${cacheKey}`);

      const result = await pool.query(
        `SELECT u.id, u.username, u.email, u.role, u.domain_id, u.created_at, d.name as domain_name
         FROM users u
         LEFT JOIN domains d ON u.domain_id = d.id
         ORDER BY u.created_at DESC`
      );

      users = result.rows;

      // Cache the result for 15 minutes
      await cache.set(cacheKey, users, 900);

      return users;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get users by domain
   */
  static async findByDomain(domainId) {
    try {
      const cacheKey = `users:domain-${domainId}`;

      // Try to get from cache first
      let users = await cache.get(cacheKey);
      if (users) {
        console.log(`🎯 Users by domain cache HIT for key: ${cacheKey}`);
        return users;
      }

      console.log(`❌ Users by domain cache MISS for key: ${cacheKey}`);

      const result = await pool.query(
        `SELECT u.id, u.username, u.email, u.role, u.domain_id, u.created_at, d.name as domain_name
         FROM users u
         LEFT JOIN domains d ON u.domain_id = d.id
         WHERE u.domain_id = $1
         ORDER BY u.created_at DESC`,
        [domainId]
      );

      users = result.rows;

      // Cache the result for 15 minutes
      await cache.set(cacheKey, users, 900);

      return users;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Count total users
   */
  static async count() {
    try {
      const result = await pool.query('SELECT COUNT(*) as count FROM users');
      return parseInt(result.rows[0].count);
    } catch (error) {
      throw error;
    }
  }
}

export default UserModel;