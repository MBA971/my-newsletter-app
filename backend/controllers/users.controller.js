import UserModel from '../models/User.js';
import { asyncHandler } from '../utils/errorHandler.js';
import pool from '../utils/database.js';

export const getAllUsers = asyncHandler(async (req, res) => {
  const users = await UserModel.findAll();
  res.json(users);
});

export const getUsersByDomain = asyncHandler(async (req, res) => {
  // For domain admins, get users in their assigned domain
  // For super admins, this endpoint might not be used or could be modified to accept a domain parameter
  
  // Get the domain admin's assigned domain from their JWT token
  const domainId = req.user.domain;
  
  console.log('[DEBUG] getUsersByDomain - Domain ID from JWT:', domainId);
  
  if (!domainId) {
    console.log('[DEBUG] getUsersByDomain - No domain assigned to user');
    return res.status(400).json({ error: 'User not assigned to a domain' });
  }
  
  // Get users in this domain (contributors and domain admins only)
  const users = await UserModel.findByDomain(domainId);
  console.log('[DEBUG] getUsersByDomain - Users found:', users);
  res.json(users);
});

export const createUser = asyncHandler(async (req, res) => {
  const { username, email, password, role, domain_id } = req.body;
  const user = await UserModel.create({ username, email, password, role, domain_id });
  res.json(user);
});

export const updateUser = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);

  // Validate ID
  if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid user ID' });
  }

  // Check permissions: Admin or Self
  const isSelf = id === parseInt(req.user.userId);

  let isAuthorized = false;

  if (req.user.role === 'super_admin') {
    isAuthorized = true;
  } else if (isSelf) {
    isAuthorized = true;
  } else if (req.user.role === 'domain_admin') {
    // Domain admins can update users in their domain
    const [requestingUserResult, targetUserResult] = await Promise.all([
      pool.query('SELECT domain_id FROM users WHERE id = $1', [req.user.userId]),
      pool.query('SELECT domain_id FROM users WHERE id = $1', [id])
    ]);

    if (requestingUserResult.rows.length > 0 && targetUserResult.rows.length > 0) {
      const requestingUserDomain = requestingUserResult.rows[0].domain_id;
      const targetUserDomain = targetUserResult.rows[0].domain_id;

      isAuthorized = requestingUserDomain && targetUserDomain && requestingUserDomain === targetUserDomain;
    }
  }

  if (!isAuthorized) {
    return res.status(403).json({ error: 'Unauthorized to update this user' });
  }

  let { username, email, role, domain_id, password } = req.body;

  // Prevent privilege escalation: Non-super_admins cannot change role
  if (req.user.role !== 'super_admin') {
    role = req.user.role;
  } else if (req.user.role === 'super_admin' && req.user.userId === id) {
    // Super admin updating their own profile - keep role as super_admin to prevent privilege escalation
    role = 'super_admin';
  }

  // Prepare update data
  const updateData = {
    username,
    email,
    password, // This will be hashed in the model
    role
  };

  // Only include domain_id in update if it's explicitly provided
  // For role-based considerations:
  // - super_admins typically don't have domain assignments, so don't update domain_id unless explicitly provided
  // - domain_admins and contributors should have domain assignments
  if (domain_id !== undefined && domain_id !== null) {
    updateData.domain_id = domain_id;
  } else if (domain_id === null) {
    // If explicitly setting to null, allow it (for removing domain assignments)
    updateData.domain_id = null;
  }
  // If domain_id is undefined, don't include it in the update (keep existing value)

  const user = await UserModel.update(id, updateData);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json(user);
});

export const deleteUser = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);

  // Validate ID
  if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid user ID' });
  }

  // First delete associated audit logs to avoid foreign key constraint violation
  await pool.query('DELETE FROM audit_log WHERE user_id = $1', [id]);

  // Then delete the user
  const deleted = await UserModel.delete(id);
  if (deleted) {
    res.json({ message: 'User deleted' });
  } else {
    res.status(404).json({ error: 'User not found' });
  }
});