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
  const domainId = req.user.domain_id;

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
  console.log(`[DEBUG] updateUser request - ID: ${id}, Body:`, JSON.stringify(req.body, null, 2));
  console.log(`[DEBUG] updateUser auth - ReqUser: ${req.user.userId}, Role: ${req.user.role}`);

  // Validate ID
  if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid user ID' });
  }

  // Check permissions: Admin or Self
  const isSelf = id === parseInt(req.user.userId);

  let isAuthorized = false;

  console.log(`[AUTH DEBUG] isSelf: ${isSelf}, req.user.role: ${req.user.role}`);

  if (req.user.role === 'super_admin' || req.user.role === 'admin') {
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

      // Ensure both are present and equal
      isAuthorized = !!requestingUserDomain && !!targetUserDomain && requestingUserDomain === targetUserDomain;

      if (!isAuthorized) {
        console.log(`[AUTH DEBUG] Domain mismatch: Admin domain ${requestingUserDomain}, Target domain ${targetUserDomain}`);
      }
    } else {
      console.log(`[AUTH DEBUG] User not found during permission check: ReqUser ${req.user.userId} found: ${requestingUserResult.rows.length > 0}, TargetUser ${id} found: ${targetUserResult.rows.length > 0}`);
    }
  }

  if (!isAuthorized) {
    console.log(`[AUTH DEBUG] Authorization failed for user ${req.user.userId}`);
    return res.status(403).json({ error: 'Unauthorized to update this user' });
  }

  let { username, email, role, domain_id, password } = req.body;

  // Prevent privilege escalation: Non-super_admins cannot change role
  if (req.user.role !== 'super_admin' && req.user.role !== 'admin') {
    role = req.user.role;
  } else if ((req.user.role === 'super_admin' || req.user.role === 'admin') && req.user.userId === id) {
    // Admin updating their own profile - keep their current role
    role = req.user.role;
  }

  // Prepare update data
  const updateData = {
    username,
    email,
    role
  };

  // Only include password if it's provided and not empty
  if (password && password.trim() !== '') {
    updateData.password = password;
  }

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