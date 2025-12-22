import React, { useState, useEffect, useMemo } from 'react';
import { Archive, Search } from 'lucide-react';
import { news as newsApi } from '../../../services/api';

const ArchivedNewsTab = ({
    currentUser,
    domainColors,
    showNotification
}) => {
    const [archivedNews, setArchivedNews] = useState([]);
    const [loadingArchivedNews, setLoadingArchivedNews] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Reset search when component mounts
    useEffect(() => {
        setSearchTerm('');
    }, []);

    // Load archived news
    useEffect(() => {
        const loadArchivedNews = async () => {
            setLoadingArchivedNews(true);
            try {
                console.log('[DEBUG] ArchivedNewsTab: Loading archived news for user:', currentUser);
                const archived = await newsApi.getArchived();
                console.log('[DEBUG] ArchivedNewsTab: Received archived news:', archived);
                console.log('[DEBUG] ArchivedNewsTab: User role:', currentUser.role);
                console.log('[DEBUG] ArchivedNewsTab: User domain_id:', currentUser.domain_id);
                setArchivedNews(archived);
            } catch (error) {
                console.error('Failed to load archived news:', error);
                if (showNotification) {
                    showNotification('Failed to load archived news. Please try again.', 'error');
                }
            } finally {
                setLoadingArchivedNews(false);
            }
        };

        loadArchivedNews();
    }, [currentUser]);
    // Helper function
    const getInitials = (name) => {
        return name
            ? name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2)
            : '??';
    };

    // Filter Logic - domain admins should only see news in their assigned domain
    const filteredArchivedNews = archivedNews.filter(item =>
        !searchTerm ||
        (item.title && item.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.author && item.author.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.domain && item.domain.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="animate-fadeIn">
            <div className="section-header">
                <div>
                    <h2 className="section-title">Archived Articles</h2>
                    <p className="text-secondary mt-1">View and manage archived newsletter content</p>
                </div>
            </div>

            {/* Search Bar */}
            <div className="mb-6 relative max-w-md">
                <div className="search-container">
                    <Search className="search-icon" size={18} />
                    <input
                        type="text"
                        placeholder="Search archived articles..."
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
                        {loadingArchivedNews ? (
                            <tr>
                                <td colSpan="5" className="text-center py-4">
                                    Loading archived articles...
                                </td>
                            </tr>
                        ) : filteredArchivedNews.length > 0 ? (
                            filteredArchivedNews.map(item => (
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
                                                {getInitials(item.author)}
                                            </div>
                                            {item.author}
                                        </div>
                                    </td>
                                    <td className="text-tertiary">{new Date(item.date).toLocaleDateString()}</td>
                                    <td>
                                        <div className="flex gap-2 justify-end">
                                            <button
                                                onClick={async () => {
                                                    try {
                                                        await newsApi.toggleArchive(item.id);
                                                        // Refresh the archived news list
                                                        const archived = await newsApi.getArchived();
                                                        setArchivedNews(archived);
                                                        if (showNotification) {
                                                            showNotification('Article restored successfully!', 'success');
                                                        }
                                                    } catch (error) {
                                                        console.error('Error restoring article:', error);
                                                        if (showNotification) {
                                                            showNotification('Failed to restore article. Please try again.', 'error');
                                                        }
                                                    }
                                                }}
                                                className="btn-icon"
                                                style={{ color: 'var(--success-600)' }}
                                                title="Restore article"
                                            >
                                                <Archive size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="5" className="text-center py-4">
                                    <p>No archived articles found matching "{searchTerm}"</p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ArchivedNewsTab;