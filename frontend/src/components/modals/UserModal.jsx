import React from 'react';
import { X, User, Mail } from 'lucide-react';

const UserModal = ({ show, onClose, onSave, userData, setUserData, isEditing, domains, isProfile }) => {
    if (!show) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content animate-scaleIn" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3 className="modal-title">{isProfile ? 'My Profile' : (isEditing ? 'Edit User' : 'Add User')}</h3>
                    <button onClick={onClose} className="btn-icon">
                        <X size={20} />
                    </button>
                </div>
                <form onSubmit={onSave} className="modal-body">
                    <div className="form-group">
                        <label className="form-label">Username</label>
                        <div className="input-with-icon">
                            <User className="input-icon" size={18} />
                            <input
                                type="text"
                                value={userData.username}
                                onChange={e => setUserData({ ...userData, username: e.target.value })}
                                className="form-input pl-10"
                                required
                            />
                        </div>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Email</label>
                        <div className="input-with-icon">
                            <Mail className="input-icon" size={18} />
                            <input
                                type="email"
                                value={userData.email}
                                onChange={e => setUserData({ ...userData, email: e.target.value })}
                                className="form-input pl-10"
                                required
                            />
                        </div>
                    </div>

                    {!isProfile && (
                        <div className="form-group">
                            <label className="form-label">Role</label>
                            <select
                                value={userData.role}
                                onChange={e => setUserData({ ...userData, role: e.target.value })}
                                className="form-select"
                            >
                                <option value="user">User</option>
                                <option value="contributor">Contributor</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>
                    )}

                    {!isProfile && userData.role === 'contributor' && (
                        <div className="form-group animate-fadeIn">
                            <label className="form-label">Domain</label>
                            <select
                                value={userData.domain}
                                onChange={e => setUserData({ ...userData, domain: e.target.value })}
                                className="form-select"
                                required
                            >
                                <option value="">Select Domain</option>
                                {domains.map(domain => (
                                    <option key={domain.id} value={domain.name}>{domain.name}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className="form-group">
                        <label className="form-label">{isEditing ? 'New Password' : 'Password'}</label>
                        <input
                            type="password"
                            value={userData.password || ''}
                            onChange={e => setUserData({ ...userData, password: e.target.value })}
                            className="form-input"
                            required={!isEditing}
                            placeholder={isEditing ? "Leave blank to keep current" : "Enter password"}
                        />
                    </div>

                    <div className="modal-footer">
                        <button type="button" onClick={onClose} className="btn btn-ghost">
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary">
                            {isEditing ? 'Update User' : 'Add User'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UserModal;
