import React, { useMemo } from 'react';
import { Plus, Newspaper, Trash2, Edit } from 'lucide-react';
import NewsModal from '../modals/NewsModal';
// import { news as newsApi } from '../../services/api'; // Removed, now inside hook
import { useNewsSubmissionLogic } from '../../hooks/useNewsSubmissionLogic';
import { useNewsFormManagement } from '../../hooks/useNewsFormManagement';
import { useNewsService } from '../../hooks/useNewsService'; // New import

const ContributorView = ({ news, domains, currentUser, showNotification, fetchData }) => {
    // Use the custom hook for modal form management
    const {
        showModal,
        setShowModal,
        editingNews,
        setEditingNews,
        formData,
        setFormData,
        closeModal,
        handleAddNew,
    } = useNewsFormManagement(currentUser, showNotification);

    // Use the custom hook for news service interactions
    const { fetchNewsItemById, saveNews, deleteNews, toggleArchive } = useNewsService(showNotification, fetchData);


    // Filter news for this contributor - Optimized with useMemo
    const contributorNews = useMemo(() => {
        if (!news || !Array.isArray(news) || !currentUser) return [];
        return news.filter(item => item.author_id === currentUser.id);
    }, [news, currentUser]);

    // Create domainColors map - Optimized with useMemo
    const domainColors = useMemo(() => {
        if (!domains || !Array.isArray(domains)) return {};
        return domains.reduce((acc, d) => {
            if (d && d.name && d.color) {
                acc[d.name] = d.color;
            }
            return acc;
        }, {});
    }, [domains]);

    const getDomainColor = (domainName) => {
        if (!domainName) return '#3b82f6';
        return domainColors[domainName] || '#3b82f6';
    };

    // Get domain name by domain ID - Optimized
    const getDomainName = useMemo(() => (domainId) => {
        if (typeof domainId === 'number' && domains && Array.isArray(domains)) {
            const domain = domains.find(d => d && d.id === domainId);
            return domain ? domain.name : '';
        }
        return '';
    }, [domains]);

    // Function to handle archive/unarchive
    const handleArchiveToggle = async (item) => {
        if (!item || !item.id) return;
        await toggleArchive(item.id, item.archived);
    };



    const handleEdit = async (item) => {
        if (!item) return;

        try {
            const newsItem = await fetchNewsItemById(item.id);
            setFormData({
                title: newsItem.title || '',
                content: newsItem.content || '',
                domain_id: newsItem.domain_id || null
            });
            setEditingNews(newsItem);
            setShowModal(true);
        } catch (error) {
            console.error('Error fetching news item:', error);
            showNotification('Failed to load article data. Please try again.', 'error');
        }
    };

    // Use the custom hook for submission logic
    const processNewsSubmission = useNewsSubmissionLogic(currentUser, showNotification, saveNews, editingNews);

    const handleSave = async (newsData) => {
        const success = await processNewsSubmission(newsData);
        if (success) {
            closeModal();
        }
    };



    // Defensive check for required props
    if (!news || !domains || !currentUser) {
        return <div>Loading...</div>;
    }

    return (
        <div className="animate-fadeIn">
            <div className="section-header">
                <h2 className="section-title">Manage Your Articles</h2>
                <button
                    onClick={handleAddNew}
                    className="btn btn-success"
                    disabled={currentUser.role === 'contributor' && !currentUser.domain_id}
                    title={currentUser.role === 'contributor' && !currentUser.domain_id ? "You must be assigned to a domain to create articles" : ""}
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
                    {currentUser.role === 'contributor' && !currentUser.domain_id && (
                        <p className="text-error-500 mt-2">
                            Note: You must be assigned to a domain by your administrator before you can create articles.
                        </p>
                    )}
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
                                            backgroundColor: getDomainColor(item.domain) + '20',
                                            color: getDomainColor(item.domain)
                                        }}
                                    >
                                        {item.domain || 'Unknown Domain'}
                                    </span>
                                    {item.pending_validation && (
                                        <span className="badge badge-warning">PENDING_VALIDATION</span>
                                    )}
                                    {item.archived && (
                                        <span className="badge" style={{ backgroundColor: '#6c757d', color: 'white' }}>ARCHIVED</span>
                                    )}
                                </div>
                                <span className="text-sm text-tertiary">
                                    {item.date ? new Date(item.date).toLocaleDateString() : 'Unknown Date'}
                                </span>
                            </div>

                            {/* Title */}
                            <h3
                                className="news-card-title"
                                style={item.archived ? { textDecoration: 'line-through', opacity: 0.7 } : {}}
                            >
                                {item.title || 'Untitled Article'}
                            </h3>

                            {/* Content preview - show more content with better truncation */}
                            <div className="news-card-content">
                                <p className="m-0">
                                    {item.content && item.content.length > 250 ?
                                        `${item.content.substring(0, 250)}...` :
                                        item.content || 'No content'}
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
                                        disabled={item.archived}                                    >
                                        <Edit size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleArchiveToggle(item)}
                                        className="news-card-action-btn"
                                        title={item.archived ? "Unarchive article" : "Archive article"}
                                    >
                                        {item.archived ? (
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                                <path d="M14 3v4a2 2 0 0 0 2 2h4" />
                                                <path d="m9 15 2 2 4-4" />
                                            </svg>
                                        ) : (
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                                <polyline points="7 10 12 15 17 10" />
                                                <line x1="12" y1="15" x2="12" y2="3" />
                                            </svg>
                                        )}
                                    </button>
                                    {item.archived ? (
                                        <button
                                            onClick={() => deleteNews(item.id)}
                                            className="news-card-action-btn"
                                            title="Permanently delete article (admins only)"
                                            disabled={true}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => deleteNews(item.id)}
                                            className="news-card-action-btn"
                                            title="Archive article"
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

            {showModal && (
                <NewsModal
                    show={showModal}
                    onClose={closeModal}
                    onSave={handleSave}
                    newsData={formData}
                    setNewsData={setFormData}
                    isEditing={!!editingNews}
                    currentUser={currentUser}
                    domains={domains}
                    showNotification={showNotification}
                />
            )}
        </div>
    );
};

export default ContributorView;