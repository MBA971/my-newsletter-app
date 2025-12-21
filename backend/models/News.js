/**
 * News model - handles all news-related database operations
 */

import pool from '../utils/database.js';
import he from 'he';
import { cache } from '../utils/cache.js';

// Helper function to decode HTML entities in news content
const decodeNewsContent = (newsItems) => {
  return newsItems.map(item => ({
    ...item,
    content: item.content ? he.decode(item.content) : item.content,
    title: item.title ? he.decode(item.title) : item.title
  }));
};

// Helper function to transform news data for response
const transformNewsResponse = (row) => {
  return {
    id: row.id,
    title: row.title,
    domain: row.domain_name || 'Unknown Domain',
    domain_id: row.domain,
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

// Get all news articles
export const getAllNews = async (includeArchived = false) => {
  const cacheKey = `news:all:archived-${includeArchived}`;

  // Try to get from cache first
  let news = await cache.get(cacheKey);
  if (news) {
    console.log(`🎯 News cache HIT for key: ${cacheKey}`);
    return news;
  }

  console.log(`❌ News cache MISS for key: ${cacheKey}`);

  let query = `
    SELECT n.*, d.name as domain_name, u.username as author_name, n.likes_count
    FROM news n
    LEFT JOIN domains d ON n.domain = d.id
    LEFT JOIN users u ON n.author_id = u.id
    WHERE n.pending_validation = false  -- Only show validated articles
  `;

  // By default, filter out archived articles
  if (!includeArchived) {
    query += ` AND n.archived = false`;
  }

  query += ` ORDER BY n.date DESC`;

  const result = await pool.query(query);

  // Transform the data to match the old format (domain as name instead of ID)
  const transformedRows = result.rows.map(row => ({
    id: row.id,
    title: row.title,
    domain: row.domain_name || 'Unknown Domain', // Use domain_name if available, otherwise show Unknown Domain
    domain_id: row.domain,
    content: row.content,
    author: row.author_name || 'Unknown Author', // Use author_name from joined users table, otherwise show Unknown Author
    author_id: row.author_id, // Explicitly include author_id
    date: row.date,
    editors: row.editors,
    likes_count: row.likes_count,
    archived: row.archived,
    pending_validation: row.pending_validation,
    validated_by: row.validated_by,
    validated_at: row.validated_at
  }));

  // Decode HTML entities in content and title
  news = decodeNewsContent(transformedRows);

  // Cache the result for 5 minutes
  await cache.set(cacheKey, news, 300);

  return news;
};

// Get news by ID
export const getNewsById = async (id) => {
  const cacheKey = `news:id-${id}`;

  // Try to get from cache first
  let news = await cache.get(cacheKey);
  if (news) {
    console.log(`🎯 News by ID cache HIT for key: ${cacheKey}`);
    return news;
  }

  console.log(`❌ News by ID cache MISS for key: ${cacheKey}`);

  const result = await pool.query(
    `SELECT n.*, d.name as domain_name, u.username as author_name, n.likes_count
     FROM news n
     LEFT JOIN domains d ON n.domain = d.id
     LEFT JOIN users u ON n.author_id = u.id
     WHERE n.id = $1`,
    [id]
  );

  if (result.rows.length === 0) {
    return null;
  }

  // Transform the data to match the old format
  const transformedRow = {
    id: result.rows[0].id,
    title: result.rows[0].title,
    domain: result.rows[0].domain_name || 'Unknown Domain',
    domain_id: result.rows[0].domain,
    content: result.rows[0].content,
    author: result.rows[0].author_name || 'Unknown Author',
    author_id: result.rows[0].author_id,
    date: result.rows[0].date,
    editors: result.rows[0].editors,
    likes_count: result.rows[0].likes_count,
    archived: result.rows[0].archived,
    pending_validation: result.rows[0].pending_validation,
    validated_by: result.rows[0].validated_by,
    validated_at: result.rows[0].validated_at
  };

  // Decode HTML entities in content and title
  news = decodeNewsContent([transformedRow])[0];

  // Cache the result for 10 minutes
  await cache.set(cacheKey, news, 600);

  return news;
};

// Create news article
export const createNews = async (title, domain, content, authorId, needsValidation = false) => {
  const result = await pool.query(
    'INSERT INTO news (title, domain, content, author_id, pending_validation) VALUES ($1, $2, $3, $4, $5) RETURNING *',
    [title, domain, content, authorId, needsValidation]
  );

  // Join with users and domains tables to get author username and domain name for response
  const joinedResult = await pool.query(
    `SELECT n.*, d.name as domain_name, u.username as author_name, n.likes_count
     FROM news n
     LEFT JOIN domains d ON n.domain = d.id
     LEFT JOIN users u ON n.author_id = u.id
     WHERE n.id = $1`,
    [result.rows[0].id]
  );

  // Transform the data to match the old format
  const transformedRow = {
    id: joinedResult.rows[0].id,
    title: joinedResult.rows[0].title,
    domain: joinedResult.rows[0].domain_name || 'Unknown Domain',
    domain_id: joinedResult.rows[0].domain,
    content: joinedResult.rows[0].content,
    author: joinedResult.rows[0].author_name || 'Unknown Author',
    author_id: joinedResult.rows[0].author_id,
    date: joinedResult.rows[0].date,
    editors: joinedResult.rows[0].editors,
    likes_count: joinedResult.rows[0].likes_count,
    archived: joinedResult.rows[0].archived,
    pending_validation: joinedResult.rows[0].pending_validation,
    validated_by: joinedResult.rows[0].validated_by,
    validated_at: joinedResult.rows[0].validated_at
  };

  // Decode HTML entities in content and title
  const news = decodeNewsContent([transformedRow])[0];

  // Invalidate relevant caches
  await cache.del(`news:all:archived-false`);
  await cache.del(`news:all:archived-true`);

  return news;
};

// Update news article
export const updateNews = async (id, title, domain, content) => {
  const result = await pool.query(
    'UPDATE news SET title = $1, domain = $2, content = $3 WHERE id = $4 RETURNING *',
    [title, domain, content, id]
  );

  // Join with users and domains tables to get author username and domain name for response
  const joinedResult = await pool.query(
    `SELECT n.*, d.name as domain_name, u.username as author_name, n.likes_count
     FROM news n
     LEFT JOIN domains d ON n.domain = d.id
     LEFT JOIN users u ON n.author_id = u.id
     WHERE n.id = $1`,
    [result.rows[0].id]
  );

  // Transform the data to match the old format
  const transformedRow = {
    id: joinedResult.rows[0].id,
    title: joinedResult.rows[0].title,
    domain: joinedResult.rows[0].domain_name || 'Unknown Domain',
    domain_id: joinedResult.rows[0].domain,
    content: joinedResult.rows[0].content,
    author: joinedResult.rows[0].author_name || 'Unknown Author',
    author_id: joinedResult.rows[0].author_id,
    date: joinedResult.rows[0].date,
    editors: joinedResult.rows[0].editors,
    likes_count: joinedResult.rows[0].likes_count,
    archived: joinedResult.rows[0].archived,
    pending_validation: joinedResult.rows[0].pending_validation,
    validated_by: joinedResult.rows[0].validated_by,
    validated_at: joinedResult.rows[0].validated_at
  };

  // Decode HTML entities in content and title
  const news = decodeNewsContent([transformedRow])[0];

  // Invalidate relevant caches
  await cache.del(`news:id-${id}`);
  await cache.del(`news:all:archived-false`);
  await cache.del(`news:all:archived-true`);

  return news;
};

// Delete news article
export const deleteNews = async (id) => {
  const result = await pool.query(
    'DELETE FROM news WHERE id = $1 RETURNING id',
    [id]
  );

  // Invalidate relevant caches
  if (result.rows.length > 0) {
    await cache.del(`news:id-${id}`);
    await cache.del(`news:all:archived-false`);
    await cache.del(`news:all:archived-true`);
  }

  return result.rows.length > 0;
};

// Search news articles
export const searchNews = async (query) => {
  const result = await pool.query(
    `SELECT n.*, d.name as domain_name, u.username as author_name, n.likes_count
     FROM news n
     LEFT JOIN domains d ON n.domain = d.id
     LEFT JOIN users u ON n.author_id = u.id
     WHERE (LOWER(n.title) LIKE LOWER($1) OR LOWER(n.content) LIKE LOWER($1))
     AND n.archived = false
     AND n.pending_validation = false
     ORDER BY n.date DESC`,
    [`%${query}%`]
  );

  // Transform the data to match the old format
  const transformedRows = result.rows.map(row => ({
    id: row.id,
    title: row.title,
    domain: row.domain_name || 'Unknown Domain',
    domain_id: row.domain,
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

// Grant edit access to news article
export const grantEditAccess = async (newsId, userEmail) => {
  // First, get the current editors array
  const currentNews = await pool.query(
    'SELECT editors FROM news WHERE id = $1',
    [newsId]
  );

  if (currentNews.rows.length === 0) {
    throw new Error('News article not found');
  }

  // Parse the current editors array and add the new email
  let editors = currentNews.rows[0].editors || [];
  if (!Array.isArray(editors)) {
    editors = [editors];
  }

  // Add the new editor if not already present
  if (!editors.includes(userEmail)) {
    editors.push(userEmail);
  }

  // Update the news article with the new editors array
  const result = await pool.query(
    'UPDATE news SET editors = $1 WHERE id = $2 RETURNING *',
    [editors, newsId]
  );

  return result.rows[0];
};

// Like news article
export const likeNews = async (newsId, ipAddress) => {
  // Check if this IP has already liked this article
  const existingLike = await pool.query(
    'SELECT id FROM likes WHERE news_id = $1 AND ip_address = $2',
    [newsId, ipAddress]
  );

  if (existingLike.rows.length > 0) {
    return false; // Already liked
  }

  // Insert the like
  await pool.query(
    'INSERT INTO likes (news_id, ip_address) VALUES ($1, $2)',
    [newsId, ipAddress]
  );

  // Update likes count
  await pool.query(
    'UPDATE news SET likes_count = likes_count + 1 WHERE id = $1',
    [newsId]
  );

  return true;
};

// Toggle archive status
export const toggleArchiveNews = async (newsId) => {
  const result = await pool.query(
    'UPDATE news SET archived = NOT archived WHERE id = $1 RETURNING id, archived',
    [newsId]
  );

  // Invalidate relevant caches
  await cache.del(`news:id-${newsId}`);
  await cache.del(`news:all:archived-false`);
  await cache.del(`news:all:archived-true`);
  await cache.del(`news:archived:all`);

  return result.rows[0] || null;
};

// Get archived news
export const getArchivedNews = async (domainId = null) => {
  const cacheKey = domainId ? `news:archived:domain-${domainId}` : 'news:archived:all';

  // Try to get from cache first
  let news = await cache.get(cacheKey);
  if (news) {
    console.log(`🎯 Archived news cache HIT for key: ${cacheKey}`);
    return news;
  }

  console.log(`❌ Archived news cache MISS for key: ${cacheKey}`);

  let query = `
    SELECT n.*, d.name as domain_name, u.username as author_name, n.likes_count
     FROM news n
     LEFT JOIN domains d ON n.domain = d.id
     LEFT JOIN users u ON n.author_id = u.id
     WHERE n.archived = true
  `;
  const params = [];

  if (domainId) {
    query += ` AND n.domain = $${params.length + 1}`;
    params.push(domainId);
  }

  query += ` ORDER BY n.date DESC`;

  const result = await pool.query(query, params);

  // Transform the data to match the old format
  const transformedRows = result.rows.map(row => ({
    id: row.id,
    title: row.title,
    domain: row.domain_name || 'Unknown Domain',
    domain_id: row.domain,
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
  news = decodeNewsContent(transformedRows);

  // Cache the result for 10 minutes
  await cache.set(cacheKey, news, 600);

  return news;
};

// Get pending validation news
export const getPendingValidationNews = async (domainId = null) => {
  const cacheKey = domainId ? `news:pending-validation:domain-${domainId}` : 'news:pending-validation:all';

  // Try to get from cache first
  let news = await cache.get(cacheKey);
  if (news) {
    console.log(`🎯 Pending validation news cache HIT for key: ${cacheKey}`);
    return news;
  }

  console.log(`❌ Pending validation news cache MISS for key: ${cacheKey}`);

  let query = `
    SELECT n.*, d.name as domain_name, u.username as author_name, n.likes_count
     FROM news n
     LEFT JOIN domains d ON n.domain = d.id
     LEFT JOIN users u ON n.author_id = u.id
     WHERE n.pending_validation = true
  `;
  const params = [];

  if (domainId) {
    query += ` AND n.domain = $${params.length + 1}`;
    params.push(domainId);
  }

  query += ` ORDER BY n.date DESC`;

  const result = await pool.query(query, params);

  // Transform the data to match the old format
  const transformedRows = result.rows.map(row => ({
    id: row.id,
    title: row.title,
    domain: row.domain_name || 'Unknown Domain',
    domain_id: row.domain,
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
  news = decodeNewsContent(transformedRows);

  // Cache the result for 5 minutes
  await cache.set(cacheKey, news, 300);

  return news;
};

// Validate news article
export const validateNews = async (newsId, validatedByUserId) => {
  const result = await pool.query(
    `UPDATE news
     SET pending_validation = false, validated_by = $1, validated_at = CURRENT_TIMESTAMP
     WHERE id = $2
     RETURNING *`,
    [validatedByUserId, newsId]
  );

  if (result.rows.length > 0) {
    // Invalidate relevant caches
    await cache.del(`news:id-${newsId}`);
    await cache.del('news:pending-validation:all');
    await cache.del('news:all:archived-false');
    await cache.del('news:all:archived-true');
  }

  return result.rows.length > 0;
};

// Get contributor news
export const getContributorNews = async (authorId) => {
  const cacheKey = `news:contributor:${authorId}`;

  // Try to get from cache first
  let news = await cache.get(cacheKey);
  if (news) {
    console.log(`🎯 Contributor news cache HIT for key: ${cacheKey}`);
    return news;
  }

  console.log(`❌ Contributor news cache MISS for key: ${cacheKey}`);

  const result = await pool.query(
    `SELECT n.*, d.name as domain_name, u.username as author_name, n.likes_count
     FROM news n
     LEFT JOIN domains d ON n.domain = d.id
     LEFT JOIN users u ON n.author_id = u.id
     WHERE n.author_id = $1
     ORDER BY n.date DESC`,
    [authorId]
  );

  // Transform the data to match the old format
  const transformedRows = result.rows.map(row => ({
    id: row.id,
    title: row.title,
    domain: row.domain_name || 'Unknown Domain',
    domain_id: row.domain,
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
  news = decodeNewsContent(transformedRows);

  // Cache the result for 10 minutes
  await cache.set(cacheKey, news, 600);

  return news;
};

// Get all news for admin
export const getAllNewsForAdmin = async (domainId = null) => {
  const cacheKey = domainId ? `news:admin:domain-${domainId}` : 'news:admin:all';

  // Try to get from cache first
  let news = await cache.get(cacheKey);
  if (news) {
    console.log(`🎯 Admin news cache HIT for key: ${cacheKey}`);
    return news;
  }

  console.log(`❌ Admin news cache MISS for key: ${cacheKey}`);

  let query = `
    SELECT n.*, d.name as domain_name, u.username as author_name, n.likes_count
    FROM news n
    LEFT JOIN domains d ON n.domain = d.id
    LEFT JOIN users u ON n.author_id = u.id
  `;
  const params = [];

  if (domainId) {
    query += ` WHERE n.domain = $1`;
    params.push(domainId);
  }

  query += ` ORDER BY n.date DESC`;

  const result = await pool.query(query, params);

  // Transform the data to match the old format
  const transformedRows = result.rows.map(row => ({
    id: row.id,
    title: row.title,
    domain: row.domain_name || 'Unknown Domain',
    domain_id: row.domain,
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
  news = decodeNewsContent(transformedRows);

  // Cache the result for 5 minutes
  await cache.set(cacheKey, news, 300);

  return news;
};