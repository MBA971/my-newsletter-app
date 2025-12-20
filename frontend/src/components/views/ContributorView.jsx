import React, { useState, useMemo } from 'react';
import { Plus, Newspaper, Trash2, Edit } from 'lucide-react';
import NewsModal from '../modals/NewsModal';

const ContributorView = ({ news, domains, currentUser, onSaveNews, onDeleteNews, onArchiveNews, onUnarchiveNews }) => {
    // State for modal
    const [showModal, setShowModal] = useState(false);
    const [editingNews, setEditingNews] = useState(null);
    const [formData, setFormData] = useState({ title: '', content: '' });

    // Filter news for this contributor - Optimized with useMemo
    const contributorNews = useMemo(() => {
        return news.filter(item => item.author_id === currentUser.id);
    }, [news, currentUser.id]);

    // Create domainColors map - Optimized with useMemo
    const domainColors = useMemo(() => {
        return domains.reduce((acc, d) => ({ ...acc, [d.name]: d.color }), {});
    }, [domains]);

    const getDomainColor = (domainName) => {
        return domainColors[domainName] || '#3b82f6';
    };

    // Get domain name by domain value (could be ID or name) - Optimized
    const getDomainName = useMemo(() => (domainValue) => {
        if (typeof domainValue === 'number') {
            const domain = domains.find(d => d.id === domainValue);
            return domain ? domain.name : '';
        }
        return typeof domainValue === 'string' ? domainValue : '';
    }, [domains]);

    // Function to handle archive/unarchive
    const handleArchiveToggle = async (item) => {
        if (item.archived) {
            await onUnarchiveNews(item.id);
        } else {
            await onArchiveNews(item.id);
        }
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

        const newsItem = {
            ...formData,
            domain: currentUser.role === 'contributor' ? currentUser.domain : formData.domain,
            author: currentUser.username
        };

        if (editingNews) {
            newsItem.id = editingNews.id;
        }

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
                        <div 
                            key={item.id} 
                            className={`card ${item.archived ? 'opacity-75' : ''}`}
                            style={item.archived ? { borderLeft: '4px solid #6c757d' } : {}}
                        >
                            {/* Header with domain and status badges */}
                            <div className="news-card-meta">
                                <div className="flex items-center gap-2">
                                    <span
                                        className="badge"
                                        style={{
                                            backgroundColor: getDomainColor(getDomainName(item.domain)) + '20',
                                            color: getDomainColor(getDomainName(item.domain))
                                        }}
                                    >
                                        {getDomainName(item.domain)}
                                    </span>
                                    {item.pending_validation && (
                                        <span className="badge badge-warning">PENDING_VALIDATION</span>
                                    )}
                                    {item.archived && (
                                        <span className="badge" style={{backgroundColor: '#6c757d', color: 'white'}}>ARCHIVED</span>
                                    )}
                                </div>
                                <span className="text-sm text-tertiary">
                                    {new Date(item.date).toLocaleDateString()}
                                </span>
                            </div>

                            {/* Title */}
                            <h3 
                                className="news-card-title" 
                                style={item.archived ? { textDecoration: 'line-through', opacity: 0.7 } : {}}
                            >
                                {item.title}
                            </h3>

                            {/* Content preview - show more content with better truncation */}
                            <div className="news-card-content">
                                <p className="m-0">
                                    {item.content.length > 250 ? 
                                        `${item.content.substring(0, 250)}...` : 
                                        item.content}
                                </p>
                            </div>

                            {/* Footer with action buttons */}
                            <div className="news-card-footer">
                                <div className="text-sm text-tertiary">
                                    {item.likes_count > 0 && (
                                        <span>{item.likes_count} like{item.likes_count !== 1 ? 's' : ''}</span>
                                    )}
                                </div>
                                <div className="news-card-actions">
                                    <button
                                        onClick={() => handleEdit(item)}
                                        className="news-card-action-btn"
                                        title={item.archived ? "Cannot edit archived article" : "Edit article"}
                                        disabled={item.archived}
                                    >
                                        <Edit size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleArchiveToggle(item)}
                                        className="news-card-action-btn"
                                        title={item.archived ? "Unarchive article" : "Archive article"}
                                    >
                                        {item.archived ? (
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                                <path d="M14 3v4a2 2 0 0 0 2 2h4"/>
                                                <path d="m9 15 2 2 4-4"/>
                                            </svg>
                                        ) : (
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                                <polyline points="7 10 12 15 17 10"/>
                                                <line x1="12" y1="15" x2="12" y2="3"/>
                                            </svg>
                                        )}
                                    </button>
                                    {item.archived ? (
                                        <button
                                            onClick={() => onDeleteNews(item.id)}
                                            className="news-card-action-btn"
                                            title="Permanently delete article (admins only)"
                                            disabled={true}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => onDeleteNews(item.id)}
                                            className="news-card-action-btn"
                                            title="Delete article"
                                        >
                                            <Trash2 size={16} />
                                        </button>
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