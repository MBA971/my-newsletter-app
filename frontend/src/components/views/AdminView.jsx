import React, { useState } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import DomainModal from '../modals/DomainModal';
import UserModal from '../modals/UserModal';
import NewsModal from '../modals/NewsModal';
import { domains as domainsApi, users as usersApi, news as newsApi, subscribers as subscribersApi } from '../../services/api';

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
        setNewUser({
            username: user.username,
            email: user.email,
            password: '',
            role: user.role,
            domain: user.domain || ''  // This should be the domain ID
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

    return (
        <div className="animate-fadeIn">
            {/* Domains Management */}
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
                                            {domain.articlecount} articles
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
                                        style={{ color: 'var(--error-600)' }}
                                    >
                                        <Trash2 size={20} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Users Management */}
            <div style={{ marginBottom: 'var(--spacing-12)' }}>
                <div className="section-header">
                    <h2 className="section-title">Manage Users</h2>
                    <button
                        onClick={() => setShowAddUser(true)}
                        className="btn btn-success"
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

                <div className="grid grid-cols-3">
                    {users.map(user => (
                        <div key={user.id} className="card">
                            <div className="flex items-center gap-3" style={{ marginBottom: 'var(--spacing-4)' }}>
                                <div className="avatar">
                                    {user.username.charAt(0).toUpperCase()}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <h3 style={{ margin: 0, marginBottom: 'var(--spacing-1)' }}>{user.username}</h3>
                                    <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', color: 'var(--text-tertiary)' }}>
                                        {user.email}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex gap-2">
                                    <span className={`badge ${user.role === 'admin' ? 'badge-secondary' : 'badge-primary'}`}>
                                        {user.role}
                                    </span>
                                    {user.domain && (
                                        <span className="badge badge-success">{getDomainNameById(user.domain)}</span>
                                    )}
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={(e) => handleEditUser(user, e)}
                                        className="btn-icon"
                                        style={{ color: 'var(--primary-600)' }}
                                    >
                                        <Edit size={20} />
                                    </button>
                                    <button
                                        onClick={() => onDeleteUser(user.id)}
                                        className="btn-icon"
                                        style={{ color: 'var(--error-600)' }}
                                    >
                                        <Trash2 size={20} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* All News Management */}
            <div>
                <h2 className="section-title">All Articles</h2>
                <div className="grid grid-cols-1">
                    {news.map(item => (
                        <div key={item.id} className="card">
                            <div className="flex items-start justify-between gap-4">
                                <div style={{ flex: 1 }}>
                                    <div className="flex items-center gap-3" style={{ marginBottom: 'var(--spacing-2)' }}>
                                        <span
                                            className="badge"
                                            style={{
                                                backgroundColor: getDomainColor(getDomainNameById(item.domain)) + '20',
                                                color: getDomainColor(getDomainNameById(item.domain))
                                            }}
                                        >
                                            {getDomainNameById(item.domain)}
                                        </span>
                                        <span className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                                            {new Date(item.date).toLocaleDateString()}
                                        </span>
                                        <span className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                                            by {item.author}
                                        </span>
                                    </div>
                                    <h3 style={{ marginBottom: 'var(--spacing-2)' }}>{item.title}</h3>
                                    <p style={{ color: 'var(--text-secondary)', marginBottom: 0 }}>{item.content}</p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={(e) => handleEditNews(item, e)}
                                        className="btn-icon"
                                        style={{ color: 'var(--primary-600)' }}
                                    >
                                        <Edit size={20} />
                                    </button>
                                    <button
                                        onClick={() => onDeleteNews(item.id)}
                                        className="btn-icon"
                                        style={{ color: 'var(--error-600)' }}
                                    >
                                        <Trash2 size={20} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <NewsModal
                show={showNewsModal}
                onClose={closeNewsModal}
                onSave={handleNewsSubmit}
                newsData={newNews}
                setNewsData={setNewNews}
                isEditing={!!editingNews}
                currentUser={currentUser}
                domainColors={domainColors}
                domains={domains}
            />
        </div>
    );
};

export default AdminView;