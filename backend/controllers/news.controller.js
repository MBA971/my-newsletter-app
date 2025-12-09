 import pool from '../utils/database.js';

export const getAllNews = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT n.*, d.name as domain_name 
       FROM news n 
       JOIN domains d ON n.domain = d.id 
       ORDER BY n.date DESC`
    );
    
    // Transform the data to match the old format (domain as name instead of ID)
    const transformedRows = result.rows.map(row => ({
      ...row,
      domain: row.domain_name
    })).map(({ domain_name, ...rest }) => rest);
    
    res.json(transformedRows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const createNews = async (req, res) => {
  try {
    let { title, domain, content } = req.body;
    const author = req.user.username;

    // Convert domain name to domain ID if domain is provided as a name
    if (domain && typeof domain === 'string') {
      console.log(`[DEBUG] Converting domain name '${domain}' to ID`);
      const domainResult = await pool.query(
        'SELECT id FROM domains WHERE name = $1',
        [domain]
      );
      console.log(`[DEBUG] Domain lookup result:`, domainResult.rows);
      if (domainResult.rows.length > 0) {
        domain = domainResult.rows[0].id;
        console.log(`[DEBUG] Converted domain to ID: ${domain}`);
      } else {
        console.log(`[DEBUG] Domain '${domain}' not found, setting to null`);
        domain = null;
      }
    }

    const result = await pool.query(
      'INSERT INTO news (title, domain, content, author, date) VALUES ($1, $2, $3, $4, CURRENT_DATE) RETURNING *',
      [title, domain, content, author]
    );
    res.json(result.rows[0]);
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
    // 2. Author can edit their own article
    // 3. Editors can edit articles they have been granted access to
    const isAuthorized = req.user.role === 'admin' ||
      article.author === req.user.username ||
      (Array.isArray(article.editors) && article.editors.includes(req.user.email));

    if (!isAuthorized) {
      return res.status(403).json({ error: 'You do not have permission to edit this article' });
    }

    console.log(`[DEBUG] Before domain conversion - domain:`, domain, `type:`, typeof domain);

    // Convert domain name to domain ID if domain is provided as a name
    if (domain && typeof domain === 'string') {
      console.log(`[DEBUG] Converting domain name '${domain}' to ID`);
      const domainResult = await pool.query(
        'SELECT id FROM domains WHERE name = $1',
        [domain]
      );
      console.log(`[DEBUG] Domain lookup result:`, domainResult.rows);
      if (domainResult.rows.length > 0) {
        domain = domainResult.rows[0].id;
        console.log(`[DEBUG] Converted domain to ID: ${domain}`);
      } else {
        console.log(`[DEBUG] Domain '${domain}' not found, setting to null`);
        domain = null;
      }
    }

    // Ensure domain is an integer if it exists
    if (domain !== null && domain !== undefined) {
      const domainId = parseInt(domain);
      if (isNaN(domainId)) {
        return res.status(400).json({ error: 'Invalid domain ID' });
      }
      domain = domainId;
    }

    console.log(`[DEBUG] After domain conversion - domain:`, domain, `type:`, typeof domain);

    const result = await pool.query(
      'UPDATE news SET title = $1, domain = $2, content = $3 WHERE id = $4 RETURNING *',
      [title, domain, content, id]
    );

    res.json(result.rows[0]);
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
    // 2. Author can delete their own article
    // 3. Editors can delete articles they have been granted access to
    const isAuthorized = req.user.role === 'admin' ||
      article.author === req.user.username ||
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
    const result = await pool.query(
      `SELECT * FROM news WHERE title ILIKE $1 OR content ILIKE $1 OR author ILIKE $1 ORDER BY date DESC`,
      [`%${q}%`]
    );
    res.json(result.rows);
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
    if (req.user.role !== 'admin' && article.author !== req.user.username) {
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