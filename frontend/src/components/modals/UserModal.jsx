import React, { useEffect, useMemo } from 'react';
import { X, User, Mail } from 'lucide-react';

const UserModal = ({ show, onClose, onSave, userData, setUserData, isEditing, domains, isProfile }) => {
    if (!show) return null;

    // Calculate selected domain ID safely
    const selectedDomainId = useMemo(() => {
        // Handle case where domains or userData might be undefined
        if (!domains || !Array.isArray(domains) || !userData || userData.domain === undefined || userData.domain === null) {
            return '';
        }
        
        // Check if userData.domain is already an ID (number) or a name (string)
        if (typeof userData.domain === 'number' || 
            (typeof userData.domain === 'string' && !isNaN(parseInt(userData.domain)))) {
            // It's an ID
            return String(parseInt(userData.domain));
        } else {
            // It's a name, find the corresponding ID
            const domainObj = domains.find(d => d.name === userData.domain);
            return domainObj ? String(domainObj.id) : '';
        }
    }, [userData?.domain, domains]);

    // Ensure role has a valid default value
    const normalizedRole = userData?.role || 'user';

    // When setting the domain in userData, we should store the domain ID for consistency
    const handleDomainChange = (e) => {
        const domainId = parseInt(e.target.value) || '';
        setUserData({ ...userData, domain: domainId });
    };

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
                                value={userData?.username || ''}
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
                                value={userData?.email || ''}
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
                                value={normalizedRole}
                                onChange={e => setUserData({ ...userData, role: e.target.value })}
                                className="form-select"
                            >
                                <option value="user">User</option>
                                <option value="contributor">Contributor</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>
                    )}

                    {!isProfile && normalizedRole === 'contributor' && (
                        <div className="form-group animate-fadeIn">
                            <label className="form-label">Domain</label>
                            <select
                                value={selectedDomainId}
                                onChange={handleDomainChange}
                                className="form-select"
                                required
                            >
                                <option value="">Select Domain</option>
                                {domains && Array.isArray(domains) ? domains.map(domain => (
                                    <option key={domain.id} value={String(domain.id)}>{domain.name}</option>
                                )) : null}
                            </select>
                        </div>
                    )}

                    <div className="form-group">
                        <label className="form-label">{isEditing ? 'New Password' : 'Password'}</label>
                        <input
                            type="password"
                            value={userData?.password || ''}
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