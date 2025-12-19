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
    // Check if we should include archived articles (default: exclude archived)
    const includeArchived = req.query.includeArchived === 'true';
    
    let query = `
      SELECT n.*, d.id as domain_id, d.name as domain_name, u.username as author_name, n.likes_count
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
      content: row.content,
      author: row.author_name || 'Unknown Author', // Use author_name from joined users table, otherwise show Unknown Author
      author_id: row.author_id, // Explicitly include author_id
      date: row.date,
      editors: row.editors,
      likes_count: row.likes_count,
      archived: row.archived
    }));
    
    // Decode HTML entities in content and title
    const decodedRows = decodeNewsContent(transformedRows);
    
    res.json(decodedRows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// New function to get all news including pending validation articles for contributors
export const getContributorNews = async (req, res) => {
  try {
    console.log('getContributorNews called with user:', req.user);
    // Get the current user's ID
    const userId = req.user.userId;
    console.log('Fetching news for user ID:', userId);
    
    let query = `
      SELECT n.*, d.id as domain_id, d.name as domain_name, u.username as author_name, n.likes_count
      FROM news n 
      LEFT JOIN domains d ON n.domain = d.id 
      LEFT JOIN users u ON n.author_id = u.id
      WHERE n.author_id = $1  -- Only show articles by this contributor
    `;
    
    // Filter out archived articles
    query += ` AND n.archived = false`;
    
    query += ` ORDER BY n.date DESC`;
    console.log('Executing query:', query, 'with userId:', userId);
    
    const result = await pool.query(query, [userId]);
    console.log('Query result rows:', result.rows.length);
    
    // Transform the data to match the old format (domain as name instead of ID)
    const transformedRows = result.rows.map(row => ({
      id: row.id,
      title: row.title,
      domain: row.domain_name || 'Unknown Domain', // Use domain_name if available, otherwise show Unknown Domain
      content: row.content,
      author: row.author_name || 'Unknown Author', // Use author_name from joined users table, otherwise show Unknown Author
      author_id: row.author_id, // Explicitly include author_id
      date: row.date,
      editors: row.editors,
      likes_count: row.likes_count,
      archived: row.archived,
      pending_validation: row.pending_validation
    }));
    console.log('Transformed rows:', transformedRows.length);
    
    // Decode HTML entities in content and title
    const decodedRows = decodeNewsContent(transformedRows);
    console.log('Decoded rows:', decodedRows.length);
    
    res.json(decodedRows);
  } catch (err) {
    console.error('Error in getContributorNews:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// New function to get all news for admin users
export const getAllNewsForAdmin = async (req, res) => {
  try {
    console.log('[DEBUG] getAllNewsForAdmin called with user:', req.user);
    
    let query = `
      SELECT n.*, d.id as domain_id, d.name as domain_name, u.username as author_name, n.likes_count
      FROM news n 
      LEFT JOIN domains d ON n.domain = d.id 
      LEFT JOIN users u ON n.author_id = u.id
    `;
    
    // Filter by domain for domain admins, but not for super admins
    const queryParams = [];
    if (req.user.role === 'domain_admin') {
      // Check if the user has a domain_id
      const userCheckQuery = 'SELECT domain_id FROM users WHERE id = $1';
      const userResult = await pool.query(userCheckQuery, [req.user.userId]);
      
      console.log('[DEBUG] Domain admin user check result:', userResult.rows);
      
      if (userResult.rows.length > 0 && userResult.rows[0].domain_id) {
        query += ` WHERE n.domain = $${queryParams.length + 1}`;
        queryParams.push(userResult.rows[0].domain_id);
        console.log('[DEBUG] Domain admin filter applied for domain ID:', userResult.rows[0].domain_id);
      } else {
        // If domain admin has no domain assigned, return empty result
        query += ` WHERE FALSE`;
        console.log('[DEBUG] Domain admin has no domain assigned, returning empty result');
      }
    }
    
    query += ` ORDER BY n.date DESC`;
    
    console.log('[DEBUG] Executing news query:', query, 'with params:', queryParams);
    const result = await pool.query(query, queryParams);
    console.log('[DEBUG] News query returned', result.rows.length, 'rows');
    console.log('[DEBUG] News query result sample:', result.rows.slice(0, 3));
    
    // Transform the data to match the old format (domain as name instead of ID)
    const transformedRows = result.rows.map(row => ({
      id: row.id,
      title: row.title,
      domain: row.domain_name || 'Unknown Domain', // Use domain_name if available, otherwise show Unknown Domain
      content: row.content,
      author: row.author_name || 'Unknown Author', // Use author_name from joined users table, otherwise show Unknown Author
      author_id: row.author_id, // Explicitly include author_id
      date: row.date,
      editors: row.editors,
      likes_count: row.likes_count,
      archived: row.archived,
      pending_validation: row.pending_validation
    }));
    
    console.log('[DEBUG] Transformed news data sample:', transformedRows.slice(0, 3));
    
    // Decode HTML entities in content and title
    const decodedRows = decodeNewsContent(transformedRows);
    
    console.log('[DEBUG] Returning', decodedRows.length, 'news items to admin user');
    res.json(decodedRows);
  } catch (err) {
    console.error('[ERROR] getAllNewsForAdmin:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const getNewsById = async (req, res) => {
  console.log('[DEBUG] getNewsById function called');
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
      `SELECT n.*, d.id as domain_id, d.name as domain_name, u.username as author_name, n.likes_count
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
      id: result.rows[0].id,
      title: result.rows[0].title,
      domain: result.rows[0].domain_name || 'Unknown Domain', // Use domain_name if available, otherwise show Unknown Domain
      content: result.rows[0].content,
      author: result.rows[0].author_name || 'Unknown Author', // Use author_name from joined users table, otherwise show Unknown Author
      author_id: result.rows[0].author_id, // Explicitly include author_id
      date: result.rows[0].date,
      editors: result.rows[0].editors,
      likes_count: result.rows[0].likes_count,
      archived: result.rows[0].archived
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
        'SELECT domain_id FROM users WHERE id = $1',
        [authorId]
      );
      
      if (userResult.rows.length > 0 && userResult.rows[0].domain_id) {
        // Set domain to contributor's assigned domain
        domain = userResult.rows[0].domain_id;
      }
    }
    // For domain admins, ensure they can only post to their assigned domain
    else if (req.user.role === 'domain_admin') {
      // Get the domain admin's domain
      const userResult = await pool.query(
        'SELECT domain_id FROM users WHERE id = $1',
        [authorId]
      );
      
      if (userResult.rows.length > 0 && userResult.rows[0].domain_id) {
        // Set domain to domain admin's assigned domain
        domain = userResult.rows[0].domain_id;
      }
    }
    // For super admins, they can post to any domain if one is provided

    // Validate that domain exists if provided
    if (domain) {
      const domainResult = await pool.query(
        'SELECT name FROM domains WHERE id = $1',
        [domain]
      );
      
      if (domainResult.rows.length === 0) {
        return res.status(400).json({ error: 'Invalid domain' });
      }
    } else {
      return res.status(400).json({ error: 'Domain is required' });
    }

    // For contributors, articles need validation
    // For super_admins and domain_admins, articles don't need validation by default
    const needsValidation = req.user.role === 'contributor';

    const result = await pool.query(
      'INSERT INTO news (title, domain, content, author_id, date, likes_count, archived, pending_validation) VALUES ($1, $2, $3, $4, CURRENT_DATE, 0, false, $5) RETURNING *',
      [title, domain, content, authorId, needsValidation]
    );

    // Join with users and domains tables to get author username and domain name for response
    const joinedResult = await pool.query(
      `SELECT n.*, d.name as domain_name, u.username as author_name
       FROM news n 
       LEFT JOIN domains d ON n.domain = d.id 
       LEFT JOIN users u ON n.author_id = u.id
       WHERE n.id = $1`,
      [result.rows[0].id]
    );
    
    // Add author name to the response
    const finalResult = {
      id: joinedResult.rows[0].id,
      title: joinedResult.rows[0].title,
      domain: joinedResult.rows[0].domain_name || 'Unknown Domain', // Use domain_name if available, otherwise show Unknown Domain
      content: joinedResult.rows[0].content,
      author: joinedResult.rows[0].author_name || 'Unknown Author',
      author_id: joinedResult.rows[0].author_id, // Explicitly include author_id
      date: joinedResult.rows[0].date,
      editors: joinedResult.rows[0].editors,
      likes_count: joinedResult.rows[0].likes_count,
      archived: joinedResult.rows[0].archived,
      pending_validation: joinedResult.rows[0].pending_validation
    };
    
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
    // 1. Super admin can edit any article
    // 2. Domain admin can edit articles in their domain
    // 3. Author can edit their own article (check by user ID)
    // 4. Editors can edit articles they have been granted access to
    let isAuthorized = false;
    
    if (req.user.role === 'super_admin') {
      isAuthorized = true;
    } else if (req.user.role === 'domain_admin') {
      // Check if the article is in the domain admin's assigned domain
      const userResult = await pool.query(
        'SELECT domain_id FROM users WHERE id = $1',
        [req.user.userId]
      );
      
      if (userResult.rows.length > 0 && userResult.rows[0].domain_id === article.domain) {
        isAuthorized = true;
      }
    } else {
      // For contributors and others
      isAuthorized = article.author_id === req.user.userId ||
        (Array.isArray(article.editors) && article.editors.includes(req.user.email));
    }

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
        'SELECT name FROM domains WHERE id = $1',
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

    // Join with users and domains tables to get author username and domain name for response
    const joinedResult = await pool.query(
      `SELECT n.*, d.name as domain_name, u.username as author_name
       FROM news n 
       LEFT JOIN domains d ON n.domain = d.id 
       LEFT JOIN users u ON n.author_id = u.id
       WHERE n.id = $1`,
      [result.rows[0].id]
    );
    
    // Add author name and domain name to the response
    const finalResult = {
      id: joinedResult.rows[0].id,
      title: joinedResult.rows[0].title,
      domain: joinedResult.rows[0].domain_name || 'Unknown Domain', // Use domain_name if available, otherwise show Unknown Domain
      content: joinedResult.rows[0].content,
      author: joinedResult.rows[0].author_name || 'Unknown Author',
      author_id: joinedResult.rows[0].author_id, // Explicitly include author_id
      date: joinedResult.rows[0].date,
      editors: joinedResult.rows[0].editors,
      likes_count: joinedResult.rows[0].likes_count,
      archived: joinedResult.rows[0].archived,
      pending_validation: joinedResult.rows[0].pending_validation
    };
    
    // Decode HTML entities in the returned data
    const decodedResult = decodeNewsContent([finalResult])[0];
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
    // 1. Super admin can delete any article (permanent delete)
    // 2. Domain admin can manage articles in their domain
    // 3. Author can archive their own article (soft delete)
    // 4. Editors can archive articles they have been granted access to (soft delete)
    let isAuthorized = false;
    let isAdmin = req.user.role === 'super_admin';
    let isDomainAdmin = false;
    
    if (req.user.role === 'domain_admin') {
      // Check if the article is in the domain admin's assigned domain
      const userResult = await pool.query(
        'SELECT domain_id FROM users WHERE id = $1',
        [req.user.userId]
      );
      
      if (userResult.rows.length > 0 && userResult.rows[0].domain_id === article.domain) {
        isDomainAdmin = true;
        isAuthorized = true;
      }
    }
    
    const isAuthor = article.author_id === req.user.userId;
    const isEditor = Array.isArray(article.editors) && article.editors.includes(req.user.email);
    
    if (!isAuthorized) {
      isAuthorized = isAdmin || isAuthor || isEditor;
    }

    if (!isAuthorized) {
      return res.status(403).json({ error: 'You do not have permission to delete this article' });
    }

    if (isAdmin || isDomainAdmin) {
      // Admins and domain admins can permanently delete
      await pool.query('DELETE FROM news WHERE id = $1', [id]);
      res.json({ message: 'News permanently deleted' });
    } else {
      // Contributors/archive - soft delete (archive)
      await pool.query('UPDATE news SET archived = true WHERE id = $1', [id]);
      res.json({ message: 'News archived' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const searchNews = async (req, res) => {
  try {
    const { q } = req.query;
    // Join with users and domains tables to search by author username and get domain names
    const result = await pool.query(
      `SELECT n.*, d.name as domain_name, u.username as author_name, n.likes_count
       FROM news n 
       LEFT JOIN domains d ON n.domain = d.id 
       LEFT JOIN users u ON n.author_id = u.id
       WHERE (n.title ILIKE $1 OR n.content ILIKE $1 OR u.username ILIKE $1) AND n.archived = false
       ORDER BY n.date DESC`,
      [`%${q}%`]
    );
    
    // Add author name to the results
    const resultsWithAuthor = result.rows.map(row => ({
      id: row.id,
      title: row.title,
      domain: row.domain_name || 'Unknown Domain', // Use domain_name if available, otherwise show Unknown Domain
      content: row.content,
      author: row.author_name || 'Unknown Author',
      author_id: row.author_id, // Explicitly include author_id
      date: row.date,
      editors: row.editors,
      likes_count: row.likes_count,
      archived: row.archived
    }));
    
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

    // Check if current user is authorized to grant access (author or super admin)
    if (req.user.role !== 'super_admin' && article.author_id !== req.user.userId) {
      return res.status(403).json({ error: 'Only the author or super admin can grant edit access' });
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

// New function to handle article likes
export const likeNews = async (req, res) => {
  try {
    const newsId = parseInt(req.params.id);
    const ipAddress = req.ip || req.connection.remoteAddress || req.socket.remoteAddress || req.headers['x-forwarded-for'];
    
    // Validate ID
    if (isNaN(newsId)) {
      return res.status(400).json({ error: 'Invalid news ID' });
    }
    
    // Check if the article exists
    const newsResult = await pool.query(
      'SELECT * FROM news WHERE id = $1',
      [newsId]
    );
    
    if (newsResult.rows.length === 0) {
      return res.status(404).json({ error: 'News article not found' });
    }
    
    // Check if this IP has already liked this article
    const likeResult = await pool.query(
      'SELECT * FROM likes WHERE news_id = $1 AND ip_address = $2',
      [newsId, ipAddress]
    );
    
    let action;
    if (likeResult.rows.length > 0) {
      // Unlike - remove the like
      await pool.query(
        'DELETE FROM likes WHERE news_id = $1 AND ip_address = $2',
        [newsId, ipAddress]
      );
      
      // Decrement the likes_count
      await pool.query(
        'UPDATE news SET likes_count = likes_count - 1 WHERE id = $1',
        [newsId]
      );
      
      action = 'unliked';
    } else {
      // Like - add the like
      await pool.query(
        'INSERT INTO likes (news_id, ip_address) VALUES ($1, $2)',
        [newsId, ipAddress]
      );
      
      // Increment the likes_count
      await pool.query(
        'UPDATE news SET likes_count = likes_count + 1 WHERE id = $1',
        [newsId]
      );
      
      action = 'liked';
    }
    
    // Get the updated likes count
    const updatedNews = await pool.query(
      'SELECT likes_count FROM news WHERE id = $1',
      [newsId]
    );
    
    res.json({ 
      message: `Article ${action} successfully`,
      likes_count: updatedNews.rows[0].likes_count,
      action: action
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// New function to archive/unarchive articles (admin only)
export const toggleArchiveNews = async (req, res) => {
  try {
    // Only admins can manually archive/unarchive
    if (req.user.role !== 'super_admin' && req.user.role !== 'domain_admin') {
      return res.status(403).json({ error: 'Only administrators can archive/unarchive articles' });
    }
    
    const id = parseInt(req.params.id);
    
    // Validate ID
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid news ID' });
    }

    // Check if the article exists
    const newsResult = await pool.query(
      'SELECT * FROM news WHERE id = $1',
      [id]
    );

    if (newsResult.rows.length === 0) {
      return res.status(404).json({ error: 'News article not found' });
    }

    const article = newsResult.rows[0];
    
    // Toggle the archived status
    const newArchivedStatus = !article.archived;
    
    await pool.query(
      'UPDATE news SET archived = $1 WHERE id = $2',
      [newArchivedStatus, id]
    );
    
    res.json({ 
      message: `News ${newArchivedStatus ? 'archived' : 'unarchived'} successfully`,
      archived: newArchivedStatus
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// New function to get archived articles (admin only)
export const getArchivedNews = async (req, res) => {
  console.log('[DEBUG] getArchivedNews function called');
  try {
    console.log('[DEBUG] getArchivedNews called with user:', req.user);
    
    // Super admins can view all archived articles
    // Domain admins can view archived articles in their domain
    if (req.user.role !== 'super_admin' && req.user.role !== 'domain_admin') {
      return res.status(403).json({ error: 'Only administrators can view archived articles' });
    }
    
    let query = `
      SELECT n.*, d.id as domain_id, d.name as domain_name, u.username as author_name, n.likes_count
      FROM news n 
      LEFT JOIN domains d ON n.domain = d.id 
      LEFT JOIN users u ON n.author_id = u.id
      WHERE n.archived = true
    `;
    
    const queryParams = [];
    
    // If user is a domain admin, filter by their domain
    if (req.user.role === 'domain_admin') {
      // Check if the user has a domain_id
      const userCheckQuery = 'SELECT domain_id FROM users WHERE id = $1';
      console.log('[DEBUG] Checking user domain with query:', userCheckQuery, 'and userId:', req.user.userId);
      const userResult = await pool.query(userCheckQuery, [req.user.userId]);
      console.log('[DEBUG] User check result:', userResult.rows);
      
      if (userResult.rows.length > 0 && userResult.rows[0].domain_id) {
        query += ` AND n.domain = $${queryParams.length + 1}`;
        queryParams.push(userResult.rows[0].domain_id);
        console.log('[DEBUG] Domain admin filter applied for domain ID:', userResult.rows[0].domain_id);
      } else {
        // If domain admin has no domain assigned, return empty result
        query += ` AND FALSE`;
        console.log('[DEBUG] Domain admin has no domain assigned, returning empty result');
      }
    }
    
    query += ` ORDER BY n.date DESC`;
    
    console.log('[DEBUG] Final query:', query);
    console.log('[DEBUG] Final params:', queryParams);
    const result = await pool.query(query, queryParams);
    console.log('[DEBUG] Query returned', result.rows.length, 'rows');
    
    // Transform the data to match the old format (domain as name instead of ID)
    const transformedRows = result.rows.map(row => ({
      id: row.id,
      title: row.title,
      domain: row.domain_name || 'Unknown Domain', // Use domain_name if available, otherwise show Unknown Domain
      content: row.content,
      author: row.author_name || 'Unknown Author', // Use author_name from joined users table, otherwise show Unknown Author
      author_id: row.author_id, // Explicitly include author_id
      date: row.date,
      editors: row.editors,
      likes_count: row.likes_count,
      archived: row.archived
    }));
    
    // Decode HTML entities in content and title
    const decodedRows = decodeNewsContent(transformedRows);
    
    console.log('[DEBUG] Returning', decodedRows.length, 'archived news items');
    res.json(decodedRows);
  } catch (err) {
    console.error('[ERROR] getArchivedNews:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get articles pending validation for a domain admin or super admin
export const getPendingValidationNews = async (req, res) => {
  try {
    console.log('[DEBUG] getPendingValidationNews called with user:', req.user);
    
    let query = `
      SELECT n.*, d.id as domain_id, d.name as domain_name, u.username as author_name, n.likes_count
      FROM news n 
      LEFT JOIN domains d ON n.domain = d.id 
      LEFT JOIN users u ON n.author_id = u.id
      WHERE n.pending_validation = true AND n.archived = false
    `;

    const queryParams = [];

    // If user is not a super admin, filter by domain
    if (req.user.role !== 'super_admin') {
      // Check if the user has a domain_id
      const userCheckQuery = 'SELECT domain_id FROM users WHERE id = $1';
      console.log('[DEBUG] Checking user domain with query:', userCheckQuery, 'and userId:', req.user.userId);
      const userResult = await pool.query(userCheckQuery, [req.user.userId]);
      console.log('[DEBUG] User check result:', userResult.rows);
      
      if (userResult.rows.length > 0 && userResult.rows[0].domain_id) {
        query += ` AND n.domain = $${queryParams.length + 1}`;
        queryParams.push(userResult.rows[0].domain_id);
        console.log('[DEBUG] Domain filter applied for domain ID:', userResult.rows[0].domain_id);
      } else {
        // If user has no domain assigned, return empty result
        query += ` AND FALSE`;
        console.log('[DEBUG] User has no domain assigned, returning empty result');
      }
    }

    query += ` ORDER BY n.date DESC`;

    console.log('[DEBUG] Final query:', query);
    console.log('[DEBUG] Final params:', queryParams);
    const result = await pool.query(query, queryParams);
    console.log('[DEBUG] Query returned', result.rows.length, 'rows');

    // Transform the data to match the old format (domain as name instead of ID)
    const transformedRows = result.rows.map(row => ({
      id: row.id,
      title: row.title,
      domain: row.domain_name || 'Unknown Domain', // Use domain_name if available, otherwise show Unknown Domain
      content: row.content,
      author: row.author_name || 'Unknown Author', // Use author_name from joined users table, otherwise show Unknown Author
      author_id: row.author_id, // Explicitly include author_id
      date: row.date,
      editors: row.editors,
      likes_count: row.likes_count,
      archived: row.archived,
      pending_validation: row.pending_validation
    }));

    // Decode HTML entities in content and title
    const decodedRows = decodeNewsContent(transformedRows);

    console.log('[DEBUG] Returning', decodedRows.length, 'pending validation news items');
    res.json(decodedRows);
  } catch (err) {
    console.error('[ERROR] getPendingValidationNews:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Validate an article
export const validateNews = async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    // Validate ID
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid news ID' });
    }

    // Get the article to check permissions
    const newsResult = await pool.query(
      `SELECT n.*, d.id as domain_id FROM news n 
       LEFT JOIN domains d ON n.domain = d.id 
       WHERE n.id = $1`,
      [id]
    );

    if (newsResult.rows.length === 0) {
      return res.status(404).json({ error: 'News article not found' });
    }

    const article = newsResult.rows[0];

    // Check if user can validate this article:
    // 1. Super admin can validate any article
    // 2. Domain admin can validate articles in their domain
    // 3. Authors can validate their own articles
    let canValidate = false;

    if (req.user.role === 'super_admin') {
      // Super admin can validate any article
      canValidate = true;
    } else if (req.user.role === 'domain_admin') {
      // Domain admin can validate articles in their domain
      // Get the domain admin's assigned domain
      const userResult = await pool.query(
        'SELECT domain_id FROM users WHERE id = $1',
        [req.user.userId]
      );
      
      if (userResult.rows.length > 0 && userResult.rows[0].domain_id === article.domain_id) {
        canValidate = true;
      }
    } else if (article.author_id === req.user.userId) {
      // Authors can validate their own articles
      canValidate = true;
    }

    if (!canValidate) {
      return res.status(403).json({ error: 'Insufficient permissions to validate this article' });
    }

    // Update the article to mark it as validated
    const result = await pool.query(
      `UPDATE news 
       SET pending_validation = false, validated_by = $1, validated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [req.user.userId, id]
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
      id: joinedResult.rows[0].id,
      title: joinedResult.rows[0].title,
      domain: joinedResult.rows[0].domain_name || 'Unknown Domain', // Use domain_name if available, otherwise show Unknown Domain
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

    res.json(finalResult);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};
