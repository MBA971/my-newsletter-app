import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Edit, Trash2, User, Search } from 'lucide-react';
import UserModal from '../../modals/UserModal';

const UsersTab = ({ 
    users, 
    currentUser, 
    onSaveUser, 
    onDeleteUser, 
    domains,
    domainColors,
    showNotification
}) => {
    // User Modal State
    const [showAddUser, setShowAddUser] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [newUser, setNewUser] = useState({ username: '', email: '', password: '', role: 'contributor', domain: '' });
    const [changePassword, setChangePassword] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Reset search when component mounts
    useEffect(() => {
        setSearchTerm('');
    }, []);

    const handleEditUser = (user, e) => {
        e.preventDefault();
        setEditingUser(user);

        // Find the domain ID from the domain name or domain_id
        let domainId = '';
        if (user.domain_name) {
            // User object has domain name
            const domainObj = domains.find(d => d.name === user.domain_name);
            if (domainObj) {
                domainId = String(domainObj.id);
            }
        } else if (user.domain_id) {
            // User object has domain ID
            domainId = String(user.domain_id);
        }

        setNewUser({
            username: user.username,
            email: user.email,
            password: '',
            role: user.role,
            domain: domainId
        });
        setShowAddUser(true);
    };

    const handleUserSubmit = async (userData) => {
        // If no userData was provided (shouldn't happen but just in case)
        if (!userData) {
            console.error('No user data provided to handleUserSubmit');
            return;
        }

        // Create a copy of userData and conditionally include password
        let userDataToSend = { ...userData };
        if (editingUser) {
            userDataToSend.id = editingUser.id;
            // For editing, only include password if changePassword is true and password is not empty
            if (!changePassword || !userDataToSend.password || userDataToSend.password.trim() === '') {
                delete userDataToSend.password;
            }
        }

        // For domain admins, ensure they can only assign users to their own domain
        if (currentUser.role === 'domain_admin') {
            // Find the domain object for the current user's domain
            const currentUserDomain = domains.find(d => d.name === currentUser.domain);
            if (currentUserDomain) {
                userDataToSend.domain = String(currentUserDomain.id);
            }
        }

        const success = await onSaveUser(userDataToSend, !!editingUser);
        if (success) closeUserModal();
    };

    const closeUserModal = () => {
        setShowAddUser(false);
        setEditingUser(null);
        setNewUser({ username: '', email: '', password: '', role: 'contributor', domain: '' });
        setChangePassword(false);
    };

    // Helper function
    const getInitials = (name) => {
        return name
            ? name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2)
            : '??';
    };

    // Filter Logic
    const filteredUsers = users.filter(user =>
        (currentUser.role === 'super_admin' || user.domain_name === currentUser.domain) &&
        (user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="animate-fadeIn">
            <div className="section-header">
                <div>
                    <h2 className="section-title">Manage Users</h2>
                    <p className="text-secondary mt-1">Control user access and permissions</p>
                </div>
                <button
                    onClick={() => setShowAddUser(true)}
                    className="btn btn-secondary"
                >
                    <Plus size={20} />
                    Add User
                </button>
            </div>

            <UserModal
                show={showAddUser}
                onClose={closeUserModal}
                onSave={handleUserSubmit}
                userData={newUser}
                setUserData={setNewUser}
                isEditing={!!editingUser}
                domains={currentUser.role === 'domain_admin' ? domains.filter(d => d.name === currentUser.domain) : domains}
                changePassword={changePassword}
                setChangePassword={setChangePassword}
            />

            {/* Search Bar */}
            <div className="mb-6 relative max-w-md">
                <div className="search-container">
                    <Search className="search-icon" size={18} />
                    <input
                        type="text"
                        placeholder="Search users..."
                        className="search-input"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="table-container">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th className="w-16">Avatar</th>
                            <th>Username</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Domain</th>
                            <th>Created At</th>
                            <th className="text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredUsers.map(user => (
                            <tr key={user.id} className="group">
                                <td>
                                    <div className="avatar avatar-sm">
                                        {getInitials(user.username)}
                                    </div>
                                </td>
                                <td>
                                    <span className="font-medium text-primary">{user.username}</span>
                                </td>
                                <td className="text-secondary">{user.email}</td>
                                <td>
                                    <span className={`badge ${
                                        user.role === 'super_admin' ? 'badge-danger' :
                                        user.role === 'domain_admin' ? 'badge-info' :
                                        user.role === 'contributor' ? 'badge-warning' : 'badge-secondary'
                                    }`}>
                                        {user.role}
                                    </span>
                                </td>
                                <td>
                                    {user.role === 'super_admin' ? (
                                        <span className="text-tertiary">All domains</span>
                                    ) : (
                                        user.domain_name ? (
                                            <span
                                                className="badge shadow-sm border border-transparent"
                                                style={{
                                                    backgroundColor: `${domainColors[user.domain_name]}15`,
                                                    color: domainColors[user.domain_name],
                                                    borderColor: `${domainColors[user.domain_name]}30`,
                                                }}
                                            >
                                                {user.domain_name}
                                            </span>
                                        ) : (
                                            <span className="text-tertiary">No domain</span>
                                        )
                                    )}
                                </td>
                                <td className="text-tertiary">
                                    {new Date(user.created_at).toLocaleDateString()}
                                </td>
                                <td>
                                    <div className="flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={(e) => handleEditUser(user, e)}
                                            className="btn-icon"
                                            style={{ color: 'var(--primary-600)' }}
                                            title="Edit user"
                                        >
                                            <Edit size={16} />
                                        </button>
                                        <button
                                            onClick={() => onDeleteUser(user.id)}
                                            className="btn-icon"
                                            style={{ color: 'var(--error-600)' }}
                                            title="Delete user"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredUsers.length === 0 && (
                    <div className="empty-state">
                        <p>No users found matching "{searchTerm}"</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UsersTab;