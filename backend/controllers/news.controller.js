import pool from '../utils/database.js';
import he from 'he';

// Helper function to decode HTML entities in news content
const decodeNewsContent = (newsItems) => {
  return newsItems.map(item => ({
    ...item,
    content: item.content ? he.decode(item.content) : item.content,
    title: item.title ? he.decode(item.title) : item.title
  }));
};

export const getAllNews = async (req, res) => {
  try {
    // Join with users table to get author username
    const result = await pool.query(
      `SELECT n.*, d.id as domain_id, d.name as domain_name, u.username as author_name
       FROM news n 
       LEFT JOIN domains d ON n.domain = d.id 
       LEFT JOIN users u ON n.author_id = u.id
       ORDER BY n.date DESC`
    );
    
    // Transform the data to match the old format (domain as name instead of ID)
    const transformedRows = result.rows.map(row => ({
      ...row,
      domain: row.domain_name || row.domain, // Use domain_name if available, otherwise fallback to domain
      author: row.author_name || 'Unknown' // Use author_name from joined users table
    })).map(({ domain_name, domain_id, author_name, ...rest }) => rest);
    
    // Decode HTML entities in content and title
    const decodedRows = decodeNewsContent(transformedRows);
    
    res.json(decodedRows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const getNewsById = async (req, res) => {
  console.log('[DEBUG] getNewsById called with id:', req.params.id);
  try {
    const id = parseInt(req.params.id);
    
    // Validate ID
    if (isNaN(id)) {
      console.log('[DEBUG] Invalid news ID provided:', req.params.id);
      return res.status(400).json({ error: 'Invalid news ID' });
    }

    console.log('[DEBUG] Querying database for news id:', id);
    // Join with users table to get author username
    const result = await pool.query(
      `SELECT n.*, d.id as domain_id, d.name as domain_name, u.username as author_name
       FROM news n 
       LEFT JOIN domains d ON n.domain = d.id 
       LEFT JOIN users u ON n.author_id = u.id
       WHERE n.id = $1`,
      [id]
    );
    
    console.log('[DEBUG] Database query result:', result.rows);
    
    if (result.rows.length === 0) {
      console.log('[DEBUG] News article not found for id:', id);
      return res.status(404).json({ error: 'News article not found' });
    }
    
    // Transform the data to match the old format (domain as name instead of ID)
    const transformedRow = {
      ...result.rows[0],
      domain: result.rows[0].domain_name || result.rows[0].domain, // Use domain_name if available, otherwise fallback to domain
      author: result.rows[0].author_name || 'Unknown' // Use author_name from joined users table
    };
    const { domain_name, domain_id, author_name, ...finalRow } = transformedRow;
    
    // Decode HTML entities in content and title
    const decodedRow = decodeNewsContent([finalRow])[0];
    
    console.log('[DEBUG] Returning news item:', decodedRow);
    res.json(decodedRow);
  } catch (err) {
    console.error('[ERROR] getNewsById:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const createNews = async (req, res) => {
  try {
    let { title, domain, content } = req.body;
    const authorId = req.user.userId; // Get the user ID

    // For contributors, ensure they can only post to their assigned domain
    if (req.user.role === 'contributor') {
      // Get the contributor's domain
      const userResult = await pool.query(
        'SELECT domain FROM users WHERE id = $1',
        [authorId]
      );
      
      if (userResult.rows.length > 0 && userResult.rows[0].domain) {
        // Set domain to contributor's assigned domain
        domain = userResult.rows[0].domain;
      }
    }

    // Validate that domain exists if provided
    if (domain) {
      const domainResult = await pool.query(
        'SELECT name FROM domains WHERE id = $1',
        [domain]
      );
      
      if (domainResult.rows.length === 0) {
        return res.status(400).json({ error: 'Invalid domain' });
      }
    }

    const result = await pool.query(
      'INSERT INTO news (title, domain, content, author_id, date) VALUES ($1, $2, $3, $4, CURRENT_DATE) RETURNING *',
      [title, domain, content, authorId]
    );
    
    // Join with users table to get author username for response
    const joinedResult = await pool.query(
      `SELECT n.*, u.username as author_name
       FROM news n 
       LEFT JOIN users u ON n.author_id = u.id
       WHERE n.id = $1`,
      [result.rows[0].id]
    );
    
    // Add author name to the response
    const finalResult = {
      ...joinedResult.rows[0],
      author: joinedResult.rows[0].author_name || 'Unknown'
    };
    delete finalResult.author_name;
    
    // Decode HTML entities in the returned data
    const decodedResult = decodeNewsContent([finalResult])[0];
    res.json(decodedResult);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const updateNews = async (req, res) => {
  console.log('[DEBUG] updateNews function called');
  try {
    // Convert ID to integer
    const id = parseInt(req.params.id);
    let { title, domain, content } = req.body;

    // Validate ID
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid news ID' });
    }

    // Check if user can edit this article
    console.log(`[DEBUG] Update News - Received ID: ${id} (Type: ${typeof id})`);

    const newsResult = await pool.query(
      'SELECT * FROM news WHERE id = $1',
      [id]
    );

    console.log(`[DEBUG] Update News - Found ${newsResult.rows.length} rows`);

    if (newsResult.rows.length === 0) {
      return res.status(404).json({ error: 'News article not found' });
    }

    const article = newsResult.rows[0];

    // Check permissions:
    // 1. Admin can edit any article
    // 2. Author can edit their own article (check by user ID)
    // 3. Editors can edit articles they have been granted access to
    const isAuthorized = req.user.role === 'admin' ||
      article.author_id === req.user.userId ||
      (Array.isArray(article.editors) && article.editors.includes(req.user.email));

    if (!isAuthorized) {
      return res.status(403).json({ error: 'You do not have permission to edit this article' });
    }

    // For contributors, ensure they cannot change the domain
    if (req.user.role === 'contributor') {
      // Override domain with the original domain to prevent domain changes
      domain = article.domain;
    }

    // Validate that domain exists if provided
    if (domain) {
      const domainResult = await pool.query(
        'SELECT name FROM domains WHERE name = $1',
        [domain]
      );
      
      if (domainResult.rows.length === 0) {
        return res.status(400).json({ error: 'Invalid domain' });
      }
    }

    const result = await pool.query(
      'UPDATE news SET title = $1, domain = $2, content = $3 WHERE id = $4 RETURNING *',
      [title, domain, content, id]
    );

    // Decode HTML entities in the returned data
    const decodedResult = decodeNewsContent(result.rows)[0];
    res.json(decodedResult);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const deleteNews = async (req, res) => {
  try {
    // Convert ID to integer
    const id = parseInt(req.params.id);
    
    // Validate ID
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid news ID' });
    }

    // Check if user can delete this article
    const newsResult = await pool.query(
      'SELECT * FROM news WHERE id = $1',
      [id]
    );

    if (newsResult.rows.length === 0) {
      return res.status(404).json({ error: 'News article not found' });
    }

    const article = newsResult.rows[0];

    // Check permissions:
    // 1. Admin can delete any article
    // 2. Author can delete their own article (check by user ID)
    // 3. Editors can delete articles they have been granted access to
    const isAuthorized = req.user.role === 'admin' ||
      article.author_id === req.user.userId ||
      (Array.isArray(article.editors) && article.editors.includes(req.user.email));

    if (!isAuthorized) {
      return res.status(403).json({ error: 'You do not have permission to delete this article' });
    }

    await pool.query('DELETE FROM news WHERE id = $1', [id]);
    res.json({ message: 'News deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const searchNews = async (req, res) => {
  try {
    const { q } = req.query;
    // Join with users table to search by author username
    const result = await pool.query(
      `SELECT n.*, u.username as author_name
       FROM news n 
       LEFT JOIN users u ON n.author_id = u.id
       WHERE n.title ILIKE $1 OR n.content ILIKE $1 OR u.username ILIKE $1 
       ORDER BY n.date DESC`,
      [`%${q}%`]
    );
    
    // Add author name to the results
    const resultsWithAuthor = result.rows.map(row => ({
      ...row,
      author: row.author_name || 'Unknown'
    })).map(({ author_name, ...rest }) => rest);
    
    // Decode HTML entities in search results
    const decodedRows = decodeNewsContent(resultsWithAuthor);
    res.json(decodedRows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const grantEditAccess = async (req, res) => {
  try {
    // Convert ID to integer
    const id = parseInt(req.params.id);
    
    // Validate ID
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid news ID' });
    }
    
    const { userEmail } = req.body; // Email of user to grant edit access

    // Check if the article exists
    const newsResult = await pool.query(
      'SELECT * FROM news WHERE id = $1',
      [id]
    );

    if (newsResult.rows.length === 0) {
      return res.status(404).json({ error: 'News article not found' });
    }

    const article = newsResult.rows[0];

    // Check if current user is authorized to grant access (author or admin)
    if (req.user.role !== 'admin' && article.author_id !== req.user.userId) {
      return res.status(403).json({ error: 'Only the author or admin can grant edit access' });
    }

    // Check if target user exists and is a contributor
    const userResult = await pool.query(
      'SELECT * FROM users WHERE email = $1 AND role = $2',
      [userEmail, 'contributor']
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found or not a contributor' });
    }

    // Add user to editors array if not already there
    const currentEditors = Array.isArray(article.editors) ? article.editors : [];
    if (!currentEditors.includes(userEmail)) {
      const newEditors = [...currentEditors, userEmail];
      await pool.query(
        'UPDATE news SET editors = $1 WHERE id = $2',
        [newEditors, id]
      );
    }

    res.json({ message: `Edit access granted to ${userEmail}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};