/**
 * News utilities - helper functions for news controller
 */

import pool from '../utils/database.js';
import he from 'he';

// Helper function to decode HTML entities in news content
export const decodeNewsContent = (newsItems) => {
  return newsItems.map(item => ({
    ...item,
    content: item.content ? he.decode(item.content) : item.content,
    title: item.title ? he.decode(item.title) : item.title
  }));
};

// Helper function to transform news data for response
export const transformNewsResponse = (row) => {
  return {
    id: row.id,
    title: row.title,
    domain: row.domain_name || 'Unknown Domain',
    content: row.content,
    author: row.author_name || 'Unknown Author',
    author_id: row.author_id,
    date: row.date,
    editors: row.editors,
    likes_count: row.likes_count,
    archived: row.archived,
    pending_validation: row.pending_validation,
    validated_by: row.validated_by,
    validated_at: row.validated_at
  };
};

// Helper function to get news with joined data
export const getNewsWithJoinedData = async (newsId) => {
  const joinedResult = await pool.query(
    `SELECT n.*, d.name as domain_name, u.username as author_name
     FROM news n
     LEFT JOIN domains d ON n.domain = d.id
     LEFT JOIN users u ON n.author_id = u.id
     WHERE n.id = $1`,
    [newsId]
  );

  if (joinedResult.rows.length === 0) {
    return null;
  }

  return transformNewsResponse(joinedResult.rows[0]);
};

// Helper function to get news list with joined data
export const getNewsListWithJoinedData = async (query, params) => {
  const result = await pool.query(query, params);
  
  const transformedRows = result.rows.map(row => ({
    id: row.id,
    title: row.title,
    domain: row.domain_name || 'Unknown Domain',
    content: row.content,
    author: row.author_name || 'Unknown Author',
    author_id: row.author_id,
    date: row.date,
    editors: row.editors,
    likes_count: row.likes_count,
    archived: row.archived,
    pending_validation: row.pending_validation,
    validated_by: row.validated_by,
    validated_at: row.validated_at
  }));

  // Decode HTML entities in content and title
  return decodeNewsContent(transformedRows);
};

// Helper function to check user domain permissions
export const checkUserDomainPermission = async (userId, articleDomainId) => {
  const userResult = await pool.query(
    'SELECT domain_id FROM users WHERE id = $1',
    [userId]
  );

  if (userResult.rows.length === 0) {
    return false;
  }

  const userDomainId = userResult.rows[0].domain_id;
  return userDomainId === articleDomainId;
};

// Helper function to validate domain exists
export const validateDomainExists = async (domainId) => {
  const domainResult = await pool.query(
    'SELECT name FROM domains WHERE id = $1',
    [domainId]
  );

  return domainResult.rows.length > 0;
};

// Helper function to validate user exists
export const validateUserExists = async (userId) => {
  const userResult = await pool.query(
    'SELECT id FROM users WHERE id = $1',
    [userId]
  );

  return userResult.rows.length > 0;
};