import React, { useState, useEffect, useMemo } from 'react';
import { X, User, Mail, Shield, Lock, Briefcase, Paintbrush } from 'lucide-react';
import ThemeSelector from '../ui/ThemeSelector';
import { getCurrentTheme, setThemePreference, applyTheme } from '../../themes/modernThemes';

const UserModal = ({ show, onClose, onSave, userData, setUserData, isEditing, domains, isProfile, changePassword, setChangePassword }) => {
    const [currentTheme, setCurrentTheme] = useState(getCurrentTheme());

    // Calculate selected domain ID safely - Moved before early return to ensure consistent hook order
    const selectedDomainId = useMemo(() => {
        if (!domains || !Array.isArray(domains) || !userData || userData.domain === undefined || userData.domain === null) {
            // For contributors, if they don't have a domain assigned, we don't want to send null
            // Instead, we should not include the domain field in the update request
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

    useEffect(() => {
        // Apply theme when it changes
        applyTheme(currentTheme);
        // Update body class when theme changes
        document.body.className = `theme-${currentTheme}`;
        return () => {
            document.body.classList.remove(`theme-${currentTheme}`);
        };
    }, [currentTheme]);

    // Early return after all hooks are declared
    if (!show) return null;

    const handleDomainChange = (e) => {
        const domainId = parseInt(e.target.value) || '';
        setUserData({ ...userData, domain: domainId });
    };

    const handleThemeChange = (themeName) => {
        setCurrentTheme(themeName);
        setThemePreference(themeName);
    };

    // Custom submit handler to handle domain properly for contributors
    const handleSubmit = (e) => {
        e.preventDefault();

        // For contributors editing their own profile, they should not change their domain assignment
        // The domain should be managed by admins only
        if (isProfile && normalizedRole === 'contributor') {
            // Create a copy of userData without the domain field for profile updates
            // Contributors shouldn't be able to change their domain assignment through profile
            const { domain, domain_id, ...userDataWithoutDomain } = userData;
            // Call onSave with the modified userData
            onSave({ ...userDataWithoutDomain });
        } else {
            // For admin users or non-profile updates, allow normal save
            onSave(userData);
        }
    };

    return (
        <div className="modal-overlay glass-dark" onClick={onClose}>
            <div className="modal-content glass animate-scaleIn" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
                <div className="modal-header">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary-500 text-white flex items-center justify-center shadow-lg">
                            {isProfile ? <User size={20} /> : <Shield size={20} />}
                        </div>
                        <div className="flex-1">
                            <h3 className="modal-title text-xl font-bold">{isProfile ? 'My Profile' : (isEditing ? 'Edit User' : 'Add New User')}</h3>
                            <p className="text-tertiary text-xs">Manage account information and permissions</p>
                        </div>
                        <button onClick={onClose} className="btn-icon text-tertiary hover:text-primary-500 transition-colors">
                            <X size={20} />
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="modal-body space-y-4 pt-6">
                    {/* Theme Selector Section - Only show in profile mode */}
                    {isProfile && (
                        <div className="theme-section p-4 rounded-xl bg-gray-50">
                            <ThemeSelector
                                currentTheme={currentTheme}
                                onThemeChange={(themeName) => {
                                    setThemePreference(themeName);
                                    setCurrentTheme(themeName);
                                }}
                            />
                        </div>
                    )}

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