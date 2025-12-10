import React, { useState } from 'react';
import { Plus, Newspaper, Trash2, Edit } from 'lucide-react';
import NewsModal from '../modals/NewsModal';

const ContributorView = ({ news, domains, currentUser, onSaveNews, onDeleteNews }) => {
    // State for modal
    const [showModal, setShowModal] = useState(false);
    const [editingNews, setEditingNews] = useState(null);
    const [formData, setFormData] = useState({ title: '', content: '' });

    // Filter news for this contributor
    // For admins in contributor view, show only articles they created
    // For contributors, show articles in their domain AND articles they authored (by user ID)
    const contributorNews = currentUser.role === 'admin'
        ? news.filter(item => item.author_id === currentUser.id)
        : news.filter(item => item.domain === currentUser.domain || item.author_id === currentUser.id);

    // Create domainColors map for NewsModal (required prop)
    const domainColors = domains.reduce((acc, d) => ({ ...acc, [d.name]: d.color }), {});

    const getDomainColor = (domainName) => {
        return domainColors[domainName] || '#3b82f6';
    };

    // Get domain name by ID
    const getDomainNameById = (domainId) => {
        if (!domains || !Array.isArray(domains)) return '';
        const domain = domains.find(d => d.id === domainId);
        return domain ? domain.name : '';
    };

    // Get domain name by domain value (could be ID or name)
    const getDomainName = (domainValue) => {
        // First try to find by ID
        if (typeof domainValue === 'number') {
            const domain = domains.find(d => d.id === domainValue);
            return domain ? domain.name : '';
        }

        // If it's a string, it might be the domain name already
        if (typeof domainValue === 'string') {
            return domainValue;
        }

        return '';
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
            // For contributors, force their domain. For admins, use the selected domain from formData
            domain: currentUser.role === 'contributor' ? currentUser.domain : formData.domain,
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
                <div className="grid-responsive">
                    {contributorNews.map(item => (
                        <div key={item.id} className="card">
                            <div className="flex items-start justify-between gap-4">
                                <div style={{ flex: 1 }}>
                                    <div className="flex items-center gap-3 mb-2">
                                        <span
                                            className="badge"
                                            style={{
                                                backgroundColor: getDomainColor(getDomainName(item.domain)) + '20',
                                                color: getDomainColor(getDomainName(item.domain))
                                            }}
                                        >
                                            {getDomainName(item.domain)}
                                        </span>
                                        <span className="text-sm text-tertiary">
                                            {new Date(item.date).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <h3 className="mb-2">{item.title}</h3>
                                    <p className="m-0 text-secondary">{item.content}</p>
                                </div>
                                <div className="flex gap-2">
                                    {((currentUser.role === 'admin') ||
                                        (item.author_id === currentUser.id) ||
                                        (Array.isArray(item.editors) && item.editors.includes(currentUser.email))) && (
                                            <>
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
                                            </>
                                        )}
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
                domains={domains}
            />
        </div>
    );
};

export default ContributorView;