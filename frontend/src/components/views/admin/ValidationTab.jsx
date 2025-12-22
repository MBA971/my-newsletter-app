import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, Search, CheckCircle, Trash2 } from 'lucide-react';
import { news as newsApi } from '../../../services/api';
const ValidationTab = ({
    currentUser,
    domainColors,
    showNotification
}) => {
    const [pendingValidationNews, setPendingValidationNews] = useState([]);
    const [loadingPendingValidationNews, setLoadingPendingValidationNews] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Reset search when component mounts
    useEffect(() => {
        setSearchTerm('');
    }, []);

    // Load pending validation news
    useEffect(() => {
        const loadPendingValidationNews = async () => {
            setLoadingPendingValidationNews(true);
            try {
                console.log('[DEBUG] ValidationTab: Loading pending validation news for user:', currentUser);
                const pending = await newsApi.getPendingValidation();
                console.log('[DEBUG] ValidationTab: Received pending validation news:', pending);
                console.log('[DEBUG] ValidationTab: User role:', currentUser.role);
                console.log('[DEBUG] ValidationTab: User domain_id:', currentUser.domain_id);
                setPendingValidationNews(pending);
            } catch (error) {
                console.error('Failed to load pending validation news:', error);
                if (showNotification) {
                    showNotification('Failed to load pending validation news. Please try again.', 'error');
                }
            } finally {
                setLoadingPendingValidationNews(false);
            }
        };

        loadPendingValidationNews();
    }, [currentUser]);
    // Helper function
    const getInitials = (name) => {
        return name
            ? name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2)
            : '??';
    };

    // Filter Logic - domain admins should only see news in their assigned domain
    const filteredPendingValidationNews = pendingValidationNews.filter(item =>
        !searchTerm ||
        (item.title && item.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.author && item.author.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.domain && item.domain.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="animate-fadeIn">
            <div className="section-header">
                <div>
                    <h2 className="section-title">Pending Validation</h2>
                    <p className="text-secondary mt-1">Review and validate pending news articles</p>
                </div>
            </div>

            {/* Search Bar */}
            <div className="mb-6 relative max-w-md">
                <div className="search-container">
                    <Search className="search-icon" size={18} />
                    <input
                        type="text"
                        placeholder="Search pending validation..."
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
                        {loadingPendingValidationNews ? (
                            <tr>
                                <td colSpan="5" className="text-center py-4">
                                    Loading pending validation...
                                </td>
                            </tr>
                        ) : filteredPendingValidationNews.length > 0 ? (
                            filteredPendingValidationNews.map(item => (
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
                                                        await newsApi.validate(item.id);
                                                        // Refresh the pending validation news list
                                                        const pending = await newsApi.getPendingValidation();
                                                        setPendingValidationNews(pending);
                                                        if (showNotification) {
                                                            showNotification('Article validated successfully!', 'success');
                                                        }
                                                    } catch (error) {
                                                        console.error('Error validating news:', error);
                                                        if (showNotification) {
                                                            showNotification('Failed to validate news. Please try again.', 'error');
                                                        }
                                                    }
                                                }}
                                                className="btn-icon"
                                                style={{ color: 'var(--success-600)' }}
                                                title="Approve article"
                                            >
                                                <CheckCircle size={16} />
                                            </button>
                                            <button
                                                onClick={async () => {
                                                    try {
                                                        // For rejection, we'll archive the article
                                                        await newsApi.toggleArchive(item.id);

                                                        // Refresh the pending validation news list
                                                        const pending = await newsApi.getPendingValidation();
                                                        setPendingValidationNews(pending);

                                                        if (showNotification) {
                                                            showNotification('Article rejected and archived!', 'info');
                                                        }
                                                    } catch (error) {
                                                        console.error('Error rejecting news:', error);
                                                        if (showNotification) {
                                                            showNotification('Failed to reject news. Please try again.', 'error');
                                                        }
                                                    }
                                                }}
                                                className="btn-icon"
                                                style={{ color: 'var(--error-600)' }}
                                                title="Reject article"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="5" className="text-center py-4">
                                    <p>No pending validation articles found matching "{searchTerm}"</p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ValidationTab;