import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Calendar, User, Shield } from 'lucide-react';
import DomainModal from '../modals/DomainModal';
import UserModal from '../modals/UserModal';
import NewsModal from '../modals/NewsModal';
import { domains as domainsApi, users as usersApi, news as newsApi, subscribers as subscribersApi, audit as auditApi } from '../../services/api';

const AdminView = ({
    domains,
    users,
    news,
    currentUser,
    onSaveDomain,
    onDeleteDomain,
    onSaveUser,
    onDeleteUser,
    onSaveNews,
    onDeleteNews,
    availableColors
}) => {
    // Domain Modal State
    const [showAddDomain, setShowAddDomain] = useState(false);
    const [editingDomain, setEditingDomain] = useState(null);
    const [newDomain, setNewDomain] = useState({ name: '', color: '#3b82f6' });

    // User Modal State
    const [showAddUser, setShowAddUser] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [newUser, setNewUser] = useState({ username: '', email: '', password: '', role: 'contributor', domain: '' });

    // News Modal State
    const [showNewsModal, setShowNewsModal] = useState(false);
    const [editingNews, setEditingNews] = useState(null);
    const [newNews, setNewNews] = useState({ title: '', content: '', domain: '' });

    // Audit Log State
    const [auditLogs, setAuditLogs] = useState([]);
    const [loadingAuditLogs, setLoadingAuditLogs] = useState(false);
    const [activeTab, setActiveTab] = useState('domains'); // domains, users, news, audit

    // Helpers
    const getDomainNameById = (domainId) => {
        const domain = domains.find(d => d.id === domainId);
        return domain ? domain.name : 'Unknown Domain';
    };

    const getDomainColor = (domainName) => {
        const domain = domains.find(d => d.name === domainName);
        return domain?.color || '#3b82f6';
    };

    const domainColors = domains.reduce((acc, d) => ({ ...acc, [d.name]: d.color }), {});

    // Load audit logs
    useEffect(() => {
        const loadAuditLogs = async () => {
            if (activeTab === 'audit') {
                setLoadingAuditLogs(true);
                try {
                    const logs = await auditApi.getAll();
                    setAuditLogs(logs);
                } catch (error) {
                    console.error('Failed to load audit logs:', error);
                } finally {
                    setLoadingAuditLogs(false);
                }
            }
        };

        loadAuditLogs();
    }, [activeTab]);

    // Handlers for Domains
    const handleEditDomain = (domain, e) => {
        e.preventDefault();
        setEditingDomain(domain);
        setNewDomain({ name: domain.name, color: domain.color });
        setShowAddDomain(true);
    };

    const handleDomainSubmit = async (e) => {
        e.preventDefault();
        const domainData = editingDomain ? { ...newDomain, id: editingDomain.id } : newDomain;
        const success = await onSaveDomain(domainData, !!editingDomain);
        if (success) closeDomainModal();
    };

    const closeDomainModal = () => {
        setShowAddDomain(false);
        setEditingDomain(null);
        setNewDomain({ name: '', color: '#3b82f6' });
    };

    // Handlers for Users
    const handleEditUser = (user, e) => {
        e.preventDefault();
        setEditingUser(user);
        
        // Find the domain ID from the domain name
        let domainId = '';
        if (user.domain) {
            const domainObj = domains.find(d => d.name === user.domain);
            if (domainObj) {
                domainId = String(domainObj.id);
            }
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

    const handleUserSubmit = async (e) => {
        e.preventDefault();
        const userData = editingUser ? { ...newUser, id: editingUser.id } : newUser;
        const success = await onSaveUser(userData, !!editingUser);
        if (success) closeUserModal();
    };

    const closeUserModal = () => {
        setShowAddUser(false);
        setEditingUser(null);
        setNewUser({ username: '', email: '', password: '', role: 'contributor', domain: '' });
    };

    const handleNewsSubmit = async (e) => {
        e.preventDefault();
        const newsData = editingNews ? { ...newNews, id: editingNews.id } : newNews;
        const success = await onSaveNews(newsData, !!editingNews);
        if (success) closeNewsModal();
    };

    const closeNewsModal = () => {
        setShowNewsModal(false);
        setEditingNews(null);
        setNewNews({ title: '', content: '', domain: '' });
    };

    // Handlers for News
    const handleEditNews = async (item, e) => {
        e.preventDefault();
        
        try {
            // Fetch the latest data from the server
            const newsItem = await newsApi.getById(item.id);
            
            setEditingNews(newsItem);
            setNewNews({
                title: newsItem.title,
                content: newsItem.content,
                domain: newsItem.domain
            });
            setShowNewsModal(true);
        } catch (error) {
            console.error('Error fetching news item:', error);
            // Fallback to the existing item data
            setEditingNews(item);
            setNewNews({
                title: item.title,
                content: item.content,
                domain: item.domain
            });
            setShowNewsModal(true);
        }
    };

    // Format timestamp for display
    const formatTimestamp = (timestamp) => {
        return new Date(timestamp).toLocaleString();
    };

    return (
        <div className="animate-fadeIn">
            {/* Tab Navigation */}
            <div className="tabs" style={{ marginBottom: 'var(--spacing-6)' }}>
                <button 
                    className={`tab ${activeTab === 'domains' ? 'active' : ''}`}
                    onClick={() => setActiveTab('domains')}
                >
                    <Shield size={16} />
                    Domains
                </button>
                <button 
                    className={`tab ${activeTab === 'users' ? 'active' : ''}`}
                    onClick={() => setActiveTab('users')}
                >
                    <User size={16} />
                    Users
                </button>
                <button 
                    className={`tab ${activeTab === 'news' ? 'active' : ''}`}
                    onClick={() => setActiveTab('news')}
                >
                    News
                </button>
                <button 
                    className={`tab ${activeTab === 'audit' ? 'active' : ''}`}
                    onClick={() => setActiveTab('audit')}
                >
                    <Calendar size={16} />
                    Audit Log
                </button>
            </div>

            {/* Domains Tab */}
            {activeTab === 'domains' && (
                <div style={{ marginBottom: 'var(--spacing-12)' }}>
                    <div className="section-header">
                        <h2 className="section-title">Manage Domains</h2>
                        <button
                            onClick={() => setShowAddDomain(true)}
                            className="btn btn-secondary"
                        >
                            <Plus size={20} />
                            Add Domain
                        </button>
                    </div>

                    <DomainModal
                        show={showAddDomain}
                        onClose={closeDomainModal}
                        onSave={handleDomainSubmit}
                        domainData={newDomain}
                        setDomainData={setNewDomain}
                        isEditing={!!editingDomain}
                        availableColors={availableColors}
                    />

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--spacing-6)' }}>
                        {domains.map(domain => (
                            <div key={domain.id} className="card">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div
                                            style={{
                                                width: '48px',
                                                height: '48px',
                                                borderRadius: 'var(--radius-lg)',
                                                backgroundColor: getDomainColor(domain.name),
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: 'white',
                                                fontWeight: 'var(--font-weight-bold)',
                                                fontSize: 'var(--font-size-xl)'
                                            }}
                                        >
                                            {domain.name.charAt(0)}
                                        </div>
                                        <div>
                                            <h3 style={{ margin: 0, marginBottom: 'var(--spacing-1)' }}>{domain.name}</h3>
                                            <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', color: 'var(--text-tertiary)' }}>
                                                {domain.articleCount} articles
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={(e) => handleEditDomain(domain, e)}
                                            className="btn-icon"
                                            style={{ color: 'var(--primary-600)' }}
                                        >
                                            <Edit size={20} />
                                        </button>
                                        <button
                                            onClick={() => onDeleteDomain(domain.id)}
                                            className="btn-icon"
                                            style={{ color: 'var(--danger-600)' }}
                                        >
                                            <Trash2 size={20} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Users Tab */}
            {activeTab === 'users' && (
                <div style={{ marginBottom: 'var(--spacing-12)' }}>
                    <div className="section-header">
                        <h2 className="section-title">Manage Users</h2>
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
                        domains={domains}
                    />

                    <div className="table-container">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Username</th>
                                    <th>Email</th>
                                    <th>Role</th>
                                    <th>Domain</th>
                                    <th>Created At</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(user => (
                                    <tr key={user.id}>
                                        <td>{user.username}</td>
                                        <td>{user.email}</td>
                                        <td>
                                            <span className={`badge ${user.role === 'admin' ? 'badge-success' : user.role === 'contributor' ? 'badge-warning' : 'badge-info'}`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td>
                                            {user.domain ? (
                                                <span 
                                                    className="badge" 
                                                    style={{ backgroundColor: domainColors[user.domain] || '#3b82f6' }}
                                                >
                                                    {user.domain}
                                                </span>
                                            ) : (
                                                '-'
                                            )}
                                        </td>
                                        <td>{new Date(user.created_at).toLocaleDateString()}</td>
                                        <td>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={(e) => handleEditUser(user, e)}
                                                    className="btn-icon"
                                                    style={{ color: 'var(--primary-600)' }}
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                <button
                                                    onClick={() => onDeleteUser(user.id)}
                                                    className="btn-icon"
                                                    style={{ color: 'var(--danger-600)' }}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* News Tab */}
            {activeTab === 'news' && (
                <div style={{ marginBottom: 'var(--spacing-12)' }}>
                    <div className="section-header">
                        <h2 className="section-title">Manage News</h2>
                        <button
                            onClick={() => {
                                setEditingNews(null);
                                setNewNews({ title: '', content: '', domain: '' });
                                setShowNewsModal(true);
                            }}
                            className="btn btn-secondary"
                        >
                            <Plus size={20} />
                            Add News
                        </button>
                    </div>

                    <NewsModal
                        show={showNewsModal}
                        onClose={closeNewsModal}
                        onSave={handleNewsSubmit}
                        newsData={newNews}
                        setNewsData={setNewNews}
                        isEditing={!!editingNews}
                        domains={domains}
                        currentUser={currentUser}
                    />

                    <div className="table-container">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Title</th>
                                    <th>Domain</th>
                                    <th>Author</th>
                                    <th>Date</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {news.map(item => (
                                    <tr key={item.id}>
                                        <td>{item.title}</td>
                                        <td>
                                            <span 
                                                className="badge" 
                                                style={{ backgroundColor: domainColors[item.domain] || '#3b82f6' }}
                                            >
                                                {item.domain}
                                            </span>
                                        </td>
                                        <td>{item.author}</td>
                                        <td>{new Date(item.date).toLocaleDateString()}</td>
                                        <td>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={(e) => handleEditNews(item, e)}
                                                    className="btn-icon"
                                                    style={{ color: 'var(--primary-600)' }}
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                <button
                                                    onClick={() => onDeleteNews(item.id)}
                                                    className="btn-icon"
                                                    style={{ color: 'var(--danger-600)' }}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Audit Log Tab */}
            {activeTab === 'audit' && (
                <div style={{ marginBottom: 'var(--spacing-12)' }}>
                    <div className="section-header">
                        <h2 className="section-title">Audit Log</h2>
                    </div>

                    {loadingAuditLogs ? (
                        <div className="loading">Loading audit logs...</div>
                    ) : (
                        <div className="table-container">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>User</th>
                                        <th>Action</th>
                                        <th>IP Address</th>
                                        <th>Timestamp</th>
                                        <th>User Agent</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {auditLogs.map(log => (
                                        <tr key={log.id}>
                                            <td>
                                                <div>
                                                    <strong>{log.username}</strong>
                                                    <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-tertiary)' }}>
                                                        {log.email}
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <span className={`badge ${log.action === 'login' ? 'badge-success' : 'badge-danger'}`}>
                                                    {log.action}
                                                </span>
                                            </td>
                                            <td>{log.ip_address || 'Unknown'}</td>
                                            <td>{formatTimestamp(log.timestamp)}</td>
                                            <td>
                                                <div style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {log.user_agent || 'Unknown'}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            
                            {auditLogs.length === 0 && (
                                <div className="empty-state">
                                    <p>No audit logs found.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default AdminView;