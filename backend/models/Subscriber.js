/**
 * Subscriber model - handles all subscriber-related database operations
 */

import pool from '../utils/database.js';

class SubscriberModel {
  /**
   * Find subscriber by email
   */
  static async findByEmail(email) {
    try {
      const result = await pool.query(
        'SELECT id, email, name, subscribed_at FROM subscribers WHERE email = $1',
        [email]
      );
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get all subscribers
   */
  static async findAll(options = {}) {
    try {
      const { limit = 50, offset = 0 } = options;
      
      const result = await pool.query(
        `SELECT id, email, name, subscribed_at
         FROM subscribers
         ORDER BY subscribed_at DESC
         LIMIT $1 OFFSET $2`,
        [limit, offset]
      );
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Create a new subscriber
   */
  static async create(subscriberData) {
    try {
      const { email, name } = subscriberData;
      
      const result = await pool.query(
        `INSERT INTO subscribers (email, name) 
         VALUES ($1, $2) 
         RETURNING id, email, name, subscribed_at`,
        [email, name || null]
      );
      
      return result.rows[0];
    } catch (error) {
      // Check for unique constraint violations
      if (error.code === '23505') { // PostgreSQL unique violation
        if (error.detail.includes('email')) {
          throw new Error('Email already subscribed');
        }
      }
      throw error;
    }
  }

  /**
   * Delete subscriber by ID
   */
  static async delete(id) {
    try {
      const result = await pool.query(
        'DELETE FROM subscribers WHERE id = $1 RETURNING id',
        [id]
      );
      return result.rows.length > 0;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Count total subscribers
   */
  static async count() {
    try {
      const result = await pool.query('SELECT COUNT(*) as count FROM subscribers');
      return parseInt(result.rows[0].count);
    } catch (error) {
      throw error;
    }
  }
}

export default SubscriberModel;