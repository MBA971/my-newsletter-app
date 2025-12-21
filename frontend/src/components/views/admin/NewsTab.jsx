import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Edit, Trash2, Archive, FileText, Search } from 'lucide-react';
import NewsModal from '../../modals/NewsModal';
import { news as newsApi } from '../../../services/api';

const NewsTab = ({
    news,
    currentUser,
    onSaveNews,
    onDeleteNews,
    domains,
    domainColors,
    showNotification
}) => {
    // News Modal State
    const [showNewsModal, setShowNewsModal] = useState(false);
    const [editingNews, setEditingNews] = useState(null);
    const [newNews, setNewNews] = useState({ title: '', content: '', domain: '' });
    const [searchTerm, setSearchTerm] = useState('');

    // Reset search when component mounts
    useEffect(() => {
        setSearchTerm('');
    }, []);

    const handleEditNews = async (item, e) => {
        e.preventDefault();

        try {
            // Fetch the latest data from the server using the API service
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

        // For domain admins, ensure they can only create/edit news in their domain
        if (currentUser.role === 'domain_admin') {
            // Find the domain ID for the current user's domain
            const currentUserDomain = domains.find(d => d.name === currentUser.domain);
            if (currentUserDomain) {
                newsData.domain = String(currentUserDomain.id);
            }
        }

        const success = await onSaveNews(newsData, !!editingNews);
        if (success) closeNewsModal();
    };

    const closeNewsModal = () => {
        setShowNewsModal(false);
        setEditingNews(null);
        setNewNews({ title: '', content: '', domain: '' });
    };

    // Filter Logic
    const filteredNews = news.filter(item =>
        (currentUser.role === 'super_admin' || item.domain_id === currentUser.domain_id) &&
        (item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.domain.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
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
                                            borderColor: `${domainColors[item.domain]}30`,
                                        }}
                                    >
                                        {item.domain}
                                    </span>
                                </td>
                                <td>
                                    <div className="flex items-center gap-2">
                                        <div className="avatar avatar-sm" style={{ width: '24px', height: '24px', fontSize: '10px' }}>
                                            {item.author ? item.author.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2) : '??'}
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
                                            title="Edit article"
                                        >
                                            <Edit size={16} />
                                        </button>
                                        <button
                                            onClick={async () => {
                                                try {
                                                    await newsApi.toggleArchive(item.id);
                                                    // Show notification
                                                    if (showNotification) {
                                                        showNotification('Archive status toggled successfully!', 'success');
                                                    }
                                                } catch (error) {
                                                    console.error('Error toggling archive status:', error);
                                                    if (showNotification) {
                                                        showNotification('Failed to toggle archive status. Please try again.', 'error');
                                                    }
                                                }
                                            }}
                                            className="btn-icon"
                                            style={{ color: 'var(--warning-600)' }}
                                            title="Archive/Unarchive article"
                                        >
                                            <Archive size={16} />
                                        </button>
                                        <button
                                            onClick={() => onDeleteNews(item.id)}
                                            className="btn-icon"
                                            style={{ color: 'var(--error-600)' }}
                                            title="Delete article"
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
    );
};

export default NewsTab;