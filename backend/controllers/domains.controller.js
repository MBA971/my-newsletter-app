import DomainModel from '../models/Domain.js';
import { asyncHandler } from '../utils/errorHandler.js';
import pool from '../utils/database.js';

export const getAllDomains = asyncHandler(async (req, res) => {
  const domains = await DomainModel.findAllWithArticleCount();
  res.json(domains);
});

export const createDomain = asyncHandler(async (req, res) => {
  // Only super admins can create domains
  if (req.user.role !== 'super_admin') {
    return res.status(403).json({ error: 'Only super admins can create domains' });
  }

  const { name, color } = req.body;
  const domain = await DomainModel.create({ name, color });
  res.json(domain);
});

export const updateDomain = asyncHandler(async (req, res) => {
  // Convert ID to integer
  const id = parseInt(req.params.id);

  // Validate ID
  if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid domain ID' });
  }

  // Check if domain admin is trying to update their assigned domain
  if (req.user.role === 'domain_admin') {
    // Get the domain admin's assigned domain
    const userResult = await pool.query(
      'SELECT domain_id FROM users WHERE id = $1',
      [req.user.userId]
    );

    if (userResult.rows.length === 0 || userResult.rows[0].domain_id !== id) {
      return res.status(403).json({ error: 'Domain admins can only update their assigned domain' });
    }
  }

  const { name, color } = req.body;
  const domain = await DomainModel.update(id, { name, color });

  if (!domain) {
    return res.status(404).json({ error: 'Domain not found' });
  }

  res.json(domain);
});

export const deleteDomain = asyncHandler(async (req, res) => {
  // Convert ID to integer
  const id = parseInt(req.params.id);

  // Validate ID
  if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid domain ID' });
  }

  // Only super admins can delete domains
  if (req.user.role !== 'super_admin') {
    return res.status(403).json({ error: 'Domain admins cannot delete domains' });
  }

  // First delete associated news to avoid foreign key constraint violation
  await pool.query('DELETE FROM news WHERE domain_id = $1', [id]);

  // Then delete the domain
  const deleted = await DomainModel.delete(id);
  if (deleted) {
    res.json({ message: 'Domain deleted' });
  } else {
    res.status(404).json({ error: 'Domain not found' });
  }
});