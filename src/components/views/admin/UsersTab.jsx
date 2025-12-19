import React from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';

const UsersTab = ({ users, handleOpenNewUser, handleEditUser, handleDeleteUser }) => {
  // Debug: Log users data
  console.log('[DEBUG] UsersTab received users:', users);
  
  return (
    <div>
      <div className="section-header">
        <h3>Manage Users</h3>
        <button
          onClick={handleOpenNewUser}
          className="btn btn-success"
        >
          <Plus size={20} />
          Add User
        </button>
      </div>
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Username</th>
              <th>Email</th>
              <th>Role</th>
              <th>Domain</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => {
              // Debug: Log each user
              console.log('[DEBUG] Rendering user:', user);
              return (
              <tr key={user.id}>
                <td>{user.username}</td>
                <td>{user.email}</td>
                <td>
                  <span className={`role-badge ${user.role}`}>
                    {user.role}
                  </span>
                </td>
                <td>
                  {user.domain || user.domain_name || user.domainId || user.domain_id || 'N/A'}
                </td>
                <td>
                  <button 
                    onClick={() => handleEditUser(user)}
                    className="btn btn-secondary"
                  >
                    <Edit size={16} />
                  </button>
                  <button 
                    onClick={() => handleDeleteUser(user.id)}
                    className="btn btn-danger"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            )})}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UsersTab;