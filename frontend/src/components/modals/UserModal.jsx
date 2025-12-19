import React, { useMemo } from 'react';
import { X, User, Mail, Shield, Lock, Briefcase } from 'lucide-react';

const UserModal = ({ show, onClose, onSave, userData, setUserData, isEditing, domains, isProfile, changePassword, setChangePassword }) => {
    if (!show) return null;

    // Calculate selected domain ID safely
    const selectedDomainId = useMemo(() => {
        if (!domains || !Array.isArray(domains) || !userData || userData.domain === undefined || userData.domain === null) {
            return '';
        }

        if (typeof userData.domain === 'number' ||
            (typeof userData.domain === 'string' && !isNaN(parseInt(userData.domain)))) {
            return String(parseInt(userData.domain));
        } else {
            const domainObj = domains.find(d => d.name === userData.domain);
            return domainObj ? String(domainObj.id) : '';
        }
    }, [userData?.domain, domains]);

    const normalizedRole = userData?.role || 'user';

    const handleDomainChange = (e) => {
        const domainId = parseInt(e.target.value) || '';
        setUserData({ ...userData, domain: domainId });
    };

    return (
        <div className="modal-overlay glass-dark" onClick={onClose}>
            <div className="modal-content glass animate-scaleIn" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
                <div className="modal-header">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary-500 text-white flex items-center justify-center shadow-lg">
                            {isProfile ? <User size={20} /> : <Shield size={20} />}
                        </div>
                        <div>
                            <h3 className="modal-title text-xl font-bold">{isProfile ? 'My Profile' : (isEditing ? 'Edit User' : 'Add New User')}</h3>
                            <p className="text-tertiary text-xs">Manage account information and permissions</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="btn-icon text-tertiary hover:text-primary-500 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={onSave} className="modal-body space-y-4 pt-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="form-group col-span-2">
                            <label className="form-label text-xs font-bold uppercase tracking-wider text-tertiary">Username</label>
                            <div className="input-with-icon">
                                <User className="input-icon" size={18} />
                                <input
                                    type="text"
                                    value={userData?.username || ''}
                                    onChange={e => setUserData({ ...userData, username: e.target.value })}
                                    className="form-input glass pl-10 h-11"
                                    required
                                    placeholder="johndoe"
                                />
                            </div>
                        </div>

                        <div className="form-group col-span-2">
                            <label className="form-label text-xs font-bold uppercase tracking-wider text-tertiary">Email Address</label>
                            <div className="input-with-icon">
                                <Mail className="input-icon" size={18} />
                                <input
                                    type="email"
                                    value={userData?.email || ''}
                                    onChange={e => setUserData({ ...userData, email: e.target.value })}
                                    className="form-input glass pl-10 h-11"
                                    required
                                    placeholder="john@example.com"
                                />
                            </div>
                        </div>

                        {!isProfile && (
                            <div className="form-group">
                                <label className="form-label text-xs font-bold uppercase tracking-wider text-tertiary">Role</label>
                                <div className="input-with-icon">
                                    <Shield className="input-icon" size={18} />
                                    <select
                                        value={normalizedRole}
                                        onChange={e => setUserData({ ...userData, role: e.target.value })}
                                        className="form-select glass pl-10 h-11"
                                    >
                                        <option value="user">User</option>
                                        <option value="contributor">Contributor</option>
                                        <option value="domain_admin">Domain Admin</option>
                                        <option value="super_admin">Super Admin</option>
                                    </select>
                                </div>
                            </div>
                        )}

                        {!isProfile && (normalizedRole === 'contributor' || normalizedRole === 'domain_admin') && (
                            <div className="form-group animate-fadeIn">
                                <label className="form-label text-xs font-bold uppercase tracking-wider text-tertiary">Assign Domain</label>
                                <div className="input-with-icon">
                                    <Briefcase className="input-icon" size={18} />
                                    <select
                                        value={selectedDomainId}
                                        onChange={handleDomainChange}
                                        className="form-select glass pl-10 h-11"
                                        required
                                    >
                                        <option value="">Select Domain</option>
                                        {domains && Array.isArray(domains) ? domains.map(domain => (
                                            <option key={domain.id} value={String(domain.id)}>{domain.name}</option>
                                        )) : null}
                                    </select>
                                </div>
                            </div>
                        )}

                        {isEditing ? (
                            <div className="form-group col-span-2">
                                <div className="flex items-center mb-2">
                                    <input
                                        type="checkbox"
                                        id="changePassword"
                                        className="mr-2"
                                        checked={changePassword}
                                        onChange={(e) => {
                                            setChangePassword(e.target.checked);
                                            if (!e.target.checked) {
                                                setUserData({ ...userData, password: '' });
                                            }
                                        }}
                                    />
                                    <label htmlFor="changePassword" className="form-label text-xs font-bold uppercase tracking-wider text-tertiary">
                                        Change Password
                                    </label>
                                </div>
                                <div className="input-with-icon">
                                    <Lock className="input-icon" size={18} />
                                    <input
                                        type="password"
                                        value={userData?.password || ''}
                                        onChange={e => setUserData({ ...userData, password: e.target.value })}
                                        className="form-input glass pl-10 h-11"
                                        placeholder="Min 8 chars, upper/lowercase, number"
                                        disabled={!changePassword}
                                    />
                                </div>
                                {changePassword && userData?.password && userData.password.trim() !== '' && (
                                    <p className="text-xs text-tertiary mt-1">Password must be at least 8 characters with uppercase, lowercase, and number</p>
                                )}
                            </div>
                        ) : (
                            <div className="form-group col-span-2">
                                <label className="form-label text-xs font-bold uppercase tracking-wider text-tertiary">
                                    Password
                                </label>
                                <div className="input-with-icon">
                                    <Lock className="input-icon" size={18} />
                                    <input
                                        type="password"
                                        value={userData?.password || ''}
                                        onChange={e => setUserData({ ...userData, password: e.target.value })}
                                        className="form-input glass pl-10 h-11"
                                        required
                                        placeholder="Min 8 chars, upper/lowercase, number"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="modal-footer border-none pt-4">
                        <button type="button" onClick={onClose} className="btn btn-ghost glass h-11 px-6">
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary h-11 px-8 shadow-primary font-bold">
                            {isProfile ? 'Save Changes' : (isEditing ? 'Update Member' : 'Create Member')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UserModal;