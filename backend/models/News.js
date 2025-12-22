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
    domain_id: row.domain, // Include the domain ID
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
  let newsArticles = await cache.get(cacheKey);
  if (newsArticles) {
    console.log(`🎯 News cache HIT for key: ${cacheKey}`);
    return newsArticles;
  }

  console.log(`❌ News cache MISS for key: ${cacheKey}`);

  let sqlQuery = `
    SELECT n.*, d.name as domain_name, u.username as author_name, n.likes_count
    FROM news n
    LEFT JOIN domains d ON n.domain_id = d.id
    LEFT JOIN users u ON n.author_id = u.id
    WHERE n.pending_validation = false  // Only show validated articles
  `;

  // By default, filter out archived articles
  if (!includeArchived) {
    sqlQuery += ` AND n.archived = false`;
  }

  sqlQuery += ` ORDER BY n.date DESC`;

  const queryResult = await pool.query(sqlQuery);

  // Transform the data to match the old format (domain as name instead of ID)
  const transformedNewsRows = queryResult.rows.map(row => ({
    id: row.id,
    title: row.title,
    domain: row.domain_name || 'Unknown Domain', // Use domain_name if available, otherwise show Unknown Domain
    domain_id: row.domain_id, // Include the domain ID
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
  newsArticles = decodeNewsContent(transformedNewsRows);

  // Cache the result for 5 minutes
  await cache.set(cacheKey, newsArticles, 300);

  return newsArticles;
};

// Get news by ID
export const getNewsById = async (id) => {
  const cacheKey = `news:id-${id}`;

  // Try to get from cache first
  let newsArticle = await cache.get(cacheKey);
  if (newsArticle) {
    console.log(`🎯 News by ID cache HIT for key: ${cacheKey}`);
    return newsArticle;
  }

  console.log(`❌ News by ID cache MISS for key: ${cacheKey}`);

  const queryResult = await pool.query(
    `SELECT n.*, d.name as domain_name, u.username as author_name, n.likes_count
     FROM news n
     LEFT JOIN domains d ON n.domain_id = d.id
     LEFT JOIN users u ON n.author_id = u.id
     WHERE n.id = $1`,
    [id]
  );

  if (queryResult.rows.length === 0) {
    return null;
  }

  // Transform the data to match the old format
  const transformedArticle = {
    id: queryResult.rows[0].id,
    title: queryResult.rows[0].title,
    domain: queryResult.rows[0].domain_name || 'Unknown Domain',
    domain_id: queryResult.rows[0].domain_id,
    content: queryResult.rows[0].content,
    author: queryResult.rows[0].author_name || 'Unknown Author',
    author_id: queryResult.rows[0].author_id,
    date: queryResult.rows[0].date,
    editors: queryResult.rows[0].editors,
    likes_count: queryResult.rows[0].likes_count,
    archived: queryResult.rows[0].archived,
    pending_validation: queryResult.rows[0].pending_validation,
    validated_by: queryResult.rows[0].validated_by,
    validated_at: queryResult.rows[0].validated_at
  };

  // Decode HTML entities in content and title
  newsArticle = decodeNewsContent([transformedArticle])[0];

  // Cache the result for 10 minutes
  await cache.set(cacheKey, newsArticle, 600);

  return newsArticle;
};

// Create news article
export const createNews = async (title, domain, content, authorId, needsValidation = false) => {
  const insertResult = await pool.query(
    'INSERT INTO news (title, domain_id, content, author_id, pending_validation) VALUES ($1, $2, $3, $4, $5) RETURNING *',
    [title, domain, content, authorId, needsValidation]
  );

  // Join with users and domains tables to get author username and domain name for response
  const joinedQueryResult = await pool.query(
    `SELECT n.*, d.name as domain_name, u.username as author_name, n.likes_count
     FROM news n
     LEFT JOIN domains d ON n.domain_id = d.id
     LEFT JOIN users u ON n.author_id = u.id
     WHERE n.id = $1`,
    [insertResult.rows[0].id]
  );

  // Transform the data to match the old format
  const transformedArticle = {
    id: joinedQueryResult.rows[0].id,
    title: joinedQueryResult.rows[0].title,
    domain: joinedQueryResult.rows[0].domain_name || 'Unknown Domain',
    domain_id: joinedQueryResult.rows[0].domain,
    content: joinedQueryResult.rows[0].content,
    author: joinedQueryResult.rows[0].author_name || 'Unknown Author',
    author_id: joinedQueryResult.rows[0].author_id,
    date: joinedQueryResult.rows[0].date,
    editors: joinedQueryResult.rows[0].editors,
    likes_count: joinedQueryResult.rows[0].likes_count,
    archived: joinedQueryResult.rows[0].archived,
    pending_validation: joinedQueryResult.rows[0].pending_validation,
    validated_by: joinedQueryResult.rows[0].validated_by,
    validated_at: joinedQueryResult.rows[0].validated_at
  };

  // Decode HTML entities in content and title
  const newNewsArticle = decodeNewsContent([transformedArticle])[0];

  // Invalidate relevant caches
  await cache.del(`news:all:archived-false`);
  await cache.del(`news:all:archived-true`);

  return newNewsArticle;
};

// Update news article
export const updateNews = async (id, title, domain, content) => {
  const updateResult = await pool.query(
    'UPDATE news SET title = $1, domain_id = $2, content = $3 WHERE id = $4 RETURNING *',
    [title, domain, content, id]
  );

  // Join with users and domains tables to get author username and domain name for response
  const joinedQueryResult = await pool.query(
    `SELECT n.*, d.name as domain_name, u.username as author_name, n.likes_count
     FROM news n
     LEFT JOIN domains d ON n.domain_id = d.id
     LEFT JOIN users u ON n.author_id = u.id
     WHERE n.id = $1`,
    [updateResult.rows[0].id]
  );

  // Transform the data to match the old format
  const transformedArticle = {
    id: joinedQueryResult.rows[0].id,
    title: joinedQueryResult.rows[0].title,
    domain: joinedQueryResult.rows[0].domain_name || 'Unknown Domain',
    domain_id: joinedQueryResult.rows[0].domain,
    content: joinedQueryResult.rows[0].content,
    author: joinedQueryResult.rows[0].author_name || 'Unknown Author',
    author_id: joinedQueryResult.rows[0].author_id,
    date: joinedQueryResult.rows[0].date,
    editors: joinedQueryResult.rows[0].editors,
    likes_count: joinedQueryResult.rows[0].likes_count,
    archived: joinedQueryResult.rows[0].archived,
    pending_validation: joinedQueryResult.rows[0].pending_validation,
    validated_by: joinedQueryResult.rows[0].validated_by,
    validated_at: joinedQueryResult.rows[0].validated_at
  };

  // Decode HTML entities in content and title
  const updatedNewsArticle = decodeNewsContent([transformedArticle])[0];

  // Invalidate relevant caches
  await cache.del(`news:id-${id}`);
  await cache.del(`news:all:archived-false`);
  await cache.del(`news:all:archived-true`);

  return updatedNewsArticle;
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
     LEFT JOIN domains d ON n.domain_id = d.id
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
    domain_id: row.domain_id,

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
     LEFT JOIN domains d ON n.domain_id = d.id
     LEFT JOIN users u ON n.author_id = u.id
     WHERE n.archived = true
  `;
  const params = [];

  if (domainId) {
    query += ` AND n.domain_id = $${params.length + 1}`;
    params.push(domainId);
  }

  query += ` ORDER BY n.date DESC`;

  const result = await pool.query(query, params);

  // Transform the data to match the old format
  const transformedRows = result.rows.map(row => ({
    id: row.id,
    title: row.title,
    domain: row.domain_name || 'Unknown Domain',
    domain_id: row.domain_id,

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
export const getPendingValidationNews = async (targetDomainId = null) => {
  const cacheKey = targetDomainId ? `news:pending-validation:domain-${targetDomainId}` : 'news:pending-validation:all';

  // Try to get from cache first
  let pendingValidationNews = await cache.get(cacheKey);
  if (pendingValidationNews) {
    console.log(`🎯 Pending validation news cache HIT for key: ${cacheKey}`);
    return pendingValidationNews;
  }

  console.log(`❌ Pending validation news cache MISS for key: ${cacheKey}`);

  let sqlQuery = `
    SELECT n.*, d.name as domain_name, u.username as author_name, n.likes_count
     FROM news n
     LEFT JOIN domains d ON n.domain_id = d.id
     LEFT JOIN users u ON n.author_id = u.id
     WHERE n.pending_validation = true
  `;
  const queryParams = [];

  if (targetDomainId) {
    sqlQuery += ` AND n.domain_id = $${queryParams.length + 1}`;
    queryParams.push(targetDomainId);
  }

  sqlQuery += ` ORDER BY n.date DESC`;

  const queryResult = await pool.query(sqlQuery, queryParams);

  // Transform the data to match the old format
  const transformedPendingValidationRows = queryResult.rows.map(row => ({
    id: row.id,
    title: row.title,
    domain: row.domain_name || 'Unknown Domain',
    domain_id: row.domain_id, // Include the domain ID (which comes from the news.domain_id column)
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
  pendingValidationNews = decodeNewsContent(transformedPendingValidationRows);

  // Cache the result for 5 minutes
  await cache.set(cacheKey, pendingValidationNews, 300);

  return pendingValidationNews;
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
     LEFT JOIN domains d ON n.domain_id = d.id
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
    domain_id: row.domain_id,

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
  let adminNews = await cache.get(cacheKey);
  if (adminNews) {
    console.log(`🎯 Admin news cache HIT for key: ${cacheKey}`);
    return adminNews;
  }

  console.log(`❌ Admin news cache MISS for key: ${cacheKey}`);

  let sqlQuery = `
    SELECT n.*, d.name as domain_name, u.username as author_name, n.likes_count
    FROM news n
    LEFT JOIN domains d ON n.domain_id = d.id
    LEFT JOIN users u ON n.author_id = u.id
  `;
  const queryParams = [];

  if (domainId) {
    sqlQuery += ` WHERE n.domain_id = $1`;
    queryParams.push(domainId);
  }

  sqlQuery += ` ORDER BY n.date DESC`;

  const queryResult = await pool.query(sqlQuery, queryParams);

  // Transform the data to match the old format
  const transformedNewsRows = queryResult.rows.map(row => ({
    id: row.id,
    title: row.title,
    domain: row.domain_name || 'Unknown Domain',
    domain_id: row.domain_id,

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
  adminNews = decodeNewsContent(transformedNewsRows);

  // Cache the result for 5 minutes
  await cache.set(cacheKey, adminNews, 300);

  return adminNews;
};
