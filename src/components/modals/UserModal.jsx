import React, { useEffect } from 'react';
import { X } from 'lucide-react';

const UserModal = ({ 
  editingUser, 
  newUser, 
  setNewUser, 
  domains,
  handleCreateUser,
  handleUpdateUser,
  handleCancelUser
}) => {
  // Reset password field when switching between create and edit modes
  useEffect(() => {
    if (!editingUser) {
      setNewUser(prev => ({ ...prev, password: '' }));
    }
  }, [editingUser, setNewUser]);

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>{editingUser ? 'Edit User' : 'Create New User'}</h2>
          <button 
            className="close-button"
            onClick={handleCancelUser}
          >
            <X size={24} />
          </button>
        </div>
        <form onSubmit={editingUser ? handleUpdateUser : handleCreateUser} className="modal-form">
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              value={newUser.username}
              onChange={(e) => setNewUser({...newUser, username: e.target.value})}
              required
              placeholder="Enter username"
            />
          </div>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={newUser.email}
              onChange={(e) => setNewUser({...newUser, email: e.target.value})}
              required
              placeholder="Enter email"
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">
              {editingUser ? 'New Password (leave blank to keep current)' : 'Password'}
            </label>
            <input
              type="password"
              id="password"
              value={newUser.password}
              onChange={(e) => setNewUser({...newUser, password: e.target.value})}
              {...(!editingUser && { required: true })}
              placeholder={editingUser ? "Enter new password" : "Enter password"}
            />
          </div>
          <div className="form-group">
            <label htmlFor="role">Role</label>
            <select
              id="role"
              value={newUser.role}
              onChange={(e) => setNewUser({...newUser, role: e.target.value})}
              required
            >
              <option value="user">User</option>
              <option value="contributor">Contributor</option>
              <option value="domain_admin">Domain Admin</option>
              <option value="super_admin">Super Admin</option>
            </select>
          </div>
          {(newUser.role === 'contributor' || newUser.role === 'domain_admin') && (
            <div className="form-group">
              <label htmlFor="domain">Domain</label>
              <select
                id="domain"
                value={newUser.domain}
                onChange={(e) => setNewUser({...newUser, domain: e.target.value})}
                required
              >
                <option value="">Select a domain</option>
                {domains.map(domain => (
                  <option key={domain.id} value={domain.id}>{domain.name}</option>
                ))}
              </select>
            </div>
          )}
          <div className="form-actions">
            <button 
              type="button" 
              onClick={handleCancelUser}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
            >
              {editingUser ? 'Update User' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserModal;