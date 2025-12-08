import React, { useState } from 'react';
import { Plus, Newspaper, Trash2, Edit } from 'lucide-react';
import NewsModal from '../modals/NewsModal';

const ContributorView = ({ news, domains, currentUser, onSaveNews, onDeleteNews }) => {
    // State for modal
    const [showModal, setShowModal] = useState(false);
    const [editingNews, setEditingNews] = useState(null);
    const [formData, setFormData] = useState({ title: '', content: '' });

    // Filter news for this contributor
    const contributorNews = news.filter(item =>
        item.domain === currentUser.domain
    );

    // Create domainColors map for NewsModal (required prop)
    const domainColors = domains.reduce((acc, d) => ({ ...acc, [d.name]: d.color }), {});

    const getDomainColor = (domainName) => {
        return domainColors[domainName] || '#3b82f6';
    };

    const handleAddNew = () => {
        setFormData({ title: '', content: '', domain: currentUser.domain });
        setEditingNews(null);
        setShowModal(true);
    };

    const handleEdit = (item) => {
        setFormData({
            title: item.title,
            content: item.content,
            domain: item.domain
        });
        setEditingNews(item);
        setShowModal(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();

        // Prepare news object
        const newsItem = {
            ...formData,
            domain: currentUser.domain, // Force domain for contributor
            author: currentUser.username
        };

        if (editingNews) {
            newsItem.id = editingNews.id;
        }

        // Call parent handler
        const success = await onSaveNews(newsItem, !!editingNews);

        if (success) {
            closeModal();
        }
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingNews(null);
        setFormData({ title: '', content: '' });
    };

    return (
        <div className="animate-fadeIn">
            <div className="section-header">
                <h2 className="section-title">Manage Your Articles</h2>
                <button
                    onClick={handleAddNew}
                    className="btn btn-success"
                >
                    <Plus size={20} />
                    Add Article
                </button>
            </div>

            {/* Articles List */}
            {contributorNews.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon">
                        <Newspaper size={40} />
                    </div>
                    <h3 className="empty-state-title">No articles yet</h3>
                    <p className="empty-state-text">Start by creating your first article</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--spacing-6)' }}>
                    {contributorNews.map(item => (
                        <div key={item.id} className="card">
                            <div className="flex items-start justify-between gap-4">
                                <div style={{ flex: 1 }}>
                                    <div className="flex items-center gap-3" style={{ marginBottom: 'var(--spacing-2)' }}>
                                        <span
                                            className="badge"
                                            style={{
                                                backgroundColor: getDomainColor(item.domain) + '20',
                                                color: getDomainColor(item.domain)
                                            }}
                                        >
                                            {item.domain}
                                        </span>
                                        <span className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                                            {new Date(item.date).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <h3 style={{ marginBottom: 'var(--spacing-2)' }}>{item.title}</h3>
                                    <p style={{ color: 'var(--text-secondary)', marginBottom: 0 }}>{item.content}</p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleEdit(item)}
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
            )}

            <NewsModal
                show={showModal}
                onClose={closeModal}
                onSave={handleSave}
                newsData={formData}
                setNewsData={setFormData}
                isEditing={!!editingNews}
                currentUser={currentUser}
                domainColors={domainColors}
            />
        </div>
    );
};

export default ContributorView;
