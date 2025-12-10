import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Calendar, User, Shield, Search, LayoutGrid, FileText, Activity, Users } from 'lucide-react';
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

    // Search State
    const [searchTerm, setSearchTerm] = useState('');

    // Reset search when tab changes
    useEffect(() => {
        setSearchTerm('');
    }, [activeTab]);

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

    // Generate initials for avatar
    const getInitials = (name) => {
        return name
            ? name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2)
            : '??';
    };

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

    const formatTimestamp = (timestamp) => {
        return new Date(timestamp).toLocaleString();
    };

    // Filter Logic
    const filteredUsers = users.filter(user =>
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredNews = news.filter(item =>
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.domain.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredAuditLogs = auditLogs.filter(log =>
        log.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.action.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Dashboard Stats
    const stats = [
        {
            label: 'Total Domains',
            value: domains.length,
            icon: Shield,
            gradientClass: 'text-gradient-blue',
            bgClass: 'bg-blue-50'
        },
        {
            label: 'Total Users',
            value: users.length,
            icon: Users,
            gradientClass: 'text-gradient-purple',
            bgClass: 'bg-purple-50'
        },
        {
            label: 'Total Articles',
            value: news.length,
            icon: FileText,
            gradientClass: 'text-gradient-green',
            bgClass: 'bg-green-50'
        },
        {
            label: 'System Activity',
            value: 'Active',
            icon: Activity,
            gradientClass: 'text-gradient-orange',
            bgClass: 'bg-orange-50'
        },
    ];

    return (
        <div className="animate-fadeIn">
            {/* Dashboard Stats */}
            <div className="grid grid-cols-4 gap-6 mb-8">
                {stats.map((stat, index) => (
                    <div key={index} className="card">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-tertiary mb-1">{stat.label}</p>
                                <h3 className="text-3xl font-bold text-primary">
                                    {stat.value}
                                </h3>
                            </div>
                            <div className={`stat-card-icon ${stat.bgClass}`}>
                                <stat.icon className={`w-8 h-8 ${stat.gradientClass}`} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Tab Navigation */}
            <div className="flex items-center justify-between mb-6">
                <div className="tabs m-0">
                    <button
                        className={`tab ${activeTab === 'domains' ? 'active' : ''}`}
                        onClick={() => setActiveTab('domains')}
                    >
                        <Shield size={18} />
                        Domains
                    </button>
                    <button
                        className={`tab ${activeTab === 'users' ? 'active' : ''}`}
                        onClick={() => setActiveTab('users')}
                    >
                        <User size={18} />
                        Users
                    </button>
                    <button
                        className={`tab ${activeTab === 'news' ? 'active' : ''}`}
                        onClick={() => setActiveTab('news')}
                    >
                        <FileText size={18} />
                        News
                    </button>
                    <button
                        className={`tab ${activeTab === 'audit' ? 'active' : ''}`}
                        onClick={() => setActiveTab('audit')}
                    >
                        <Activity size={18} />
                        Audit Log
                    </button>
                </div>
            </div>

            {/* Domains Tab */}
            {activeTab === 'domains' && (
                <div className="animate-fadeIn">
                    <div className="section-header">
                        <div>
                            <h2 className="section-title">Manage Domains</h2>
                            <p className="text-secondary mt-1">Configure newsletter domains and styling</p>
                        </div>
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

                    <div className="grid-responsive">
                        {domains.map(domain => (
                            <div key={domain.id} className="card group">
                                <div className="flex items-center justify-between mb-4">
                                    <div
                                        className="domain-icon group-hover:scale-110 transition-transform"
                                        style={{ backgroundColor: getDomainColor(domain.name) }}
                                    >
                                        {domain.name.charAt(0)}
                                    </div>
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={(e) => handleEditDomain(domain, e)}
                                            className="btn-icon"
                                            style={{ color: 'var(--primary-600)' }}
                                        >
                                            <Edit size={18} />
                                        </button>
                                        <button
                                            onClick={() => onDeleteDomain(domain.id)}
                                            className="btn-icon"
                                            style={{ color: 'var(--error-600)' }}
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                                <h3 className="text-xl font-bold mb-1">{domain.name}</h3>
                                <div className="flex items-center justify-between text-sm text-tertiary">
                                    <span>{domain.articleCount || 0} articles</span>
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--success-500)' }}></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Users Tab */}
            {activeTab === 'users' && (
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
                        domains={domains}
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
                                            <span className={`badge ${user.role === 'admin' ? 'badge-success' :
                                                    user.role === 'contributor' ? 'badge-warning' : 'badge-info'
                                                }`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td>
                                            {user.domain ? (
                                                <div className="flex items-center gap-2">
                                                    <div
                                                        className="w-2 h-2 rounded-full"
                                                        style={{ backgroundColor: domainColors[user.domain] || '#3b82f6' }}
                                                    ></div>
                                                    {user.domain}
                                                </div>
                                            ) : (
                                                <span className="text-tertiary">-</span>
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
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                <button
                                                    onClick={() => onDeleteUser(user.id)}
                                                    className="btn-icon"
                                                    style={{ color: 'var(--error-600)' }}
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
            )}

            {/* News Tab */}
            {activeTab === 'news' && (
                <div className="animate-fadeIn">
                    <div className="section-header">
                        <div>
                            <h2 className="section-title">Manage News</h2>
                            <p className="text-secondary mt-1">Review and manage newsletter content</p>
                        </div>
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

                    {/* Search Bar */}
                    <div className="mb-6 relative max-w-md">
                        <div className="search-container">
                            <Search className="search-icon" size={18} />
                            <input
                                type="text"
                                placeholder="Search articles..."
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
                                    <th>Title</th>
                                    <th>Domain</th>
                                    <th>Author</th>
                                    <th>Date</th>
                                    <th className="text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredNews.map(item => (
                                    <tr key={item.id} className="group">
                                        <td className="font-medium text-primary">{item.title}</td>
                                        <td>
                                            <span
                                                className="badge shadow-sm border border-transparent"
                                                style={{
                                                    backgroundColor: `${domainColors[item.domain]}15`,
                                                    color: domainColors[item.domain],
                                                    borderColor: `${domainColors[item.domain]}30`
                                                }}
                                            >
                                                {item.domain}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="flex items-center gap-2">
                                                <div className="avatar avatar-sm" style={{ width: '24px', height: '24px', fontSize: '10px' }}>
                                                    {getInitials(item.author)}
                                                </div>
                                                {item.author}
                                            </div>
                                        </td>
                                        <td className="text-tertiary">{new Date(item.date).toLocaleDateString()}</td>
                                        <td>
                                            <div className="flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
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
                                                    style={{ color: 'var(--error-600)' }}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {filteredNews.length === 0 && (
                            <div className="empty-state">
                                <p>No news articles found matching "{searchTerm}"</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Audit Log Tab */}
            {activeTab === 'audit' && (
                <div className="animate-fadeIn">
                    <div className="section-header">
                        <div>
                            <h2 className="section-title">Audit Log</h2>
                            <p className="text-secondary mt-1">Track system security and user details</p>
                        </div>
                    </div>

                    {/* Search Bar */}
                    <div className="mb-6 relative max-w-md">
                        <div className="search-container">
                            <Search className="search-icon" size={18} />
                            <input
                                type="text"
                                placeholder="Search logs..."
                                className="search-input"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    {loadingAuditLogs ? (
                        <div className="flex justify-center py-12">
                            <div className="spinner spinner-lg"></div>
                        </div>
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
                                    {filteredAuditLogs.map(log => (
                                        <tr key={log.id}>
                                            <td>
                                                <div className="flex items-center gap-3">
                                                    <div className="avatar avatar-sm">
                                                        {getInitials(log.username || 'System')}
                                                    </div>
                                                    <div>
                                                        <div className="font-medium text-primary">{log.username}</div>
                                                        <div className="text-xs text-tertiary">{log.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <span className={`badge ${log.action === 'login' ? 'badge-success' :
                                                        log.action.includes('delete') ? 'badge-error' :
                                                            'badge-warning'
                                                    }`}>
                                                    {log.action}
                                                </span>
                                            </td>
                                            <td className="text-sm text-secondary">{log.ip_address || 'Unknown'}</td>
                                            <td className="text-secondary text-sm">{formatTimestamp(log.timestamp)}</td>
                                            <td>
                                                <div className="text-truncate text-xs text-tertiary" style={{ maxWidth: '200px' }} title={log.user_agent}>
                                                    {log.user_agent || 'Unknown'}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {filteredAuditLogs.length === 0 && (
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