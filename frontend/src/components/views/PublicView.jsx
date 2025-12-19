import React, { useState, useMemo, useEffect } from 'react';
import { Search, Newspaper, User, Calendar } from 'lucide-react';
import SkeletonCard from '../ui/SkeletonCard';

const PublicView = ({ news, domains, isLoading }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterDomain, setFilterDomain] = useState('all');
    const [likedArticles, setLikedArticles] = useState({});
    const [articlesLikes, setArticlesLikes] = useState({});

    // Memoized domain colors mapping
    const domainColorsMap = useMemo(() => {
        const map = {};
        domains.forEach(d => {
            map[d.name] = d.color;
        });
        return map;
    }, [domains]);

    const getDomainColor = (domainName) => {
        return domainColorsMap[domainName] || '#3b82f6';
    };

    // Initialize/Update likes count when news changes
    useEffect(() => {
        if (news?.length > 0) {
            const initialCounts = {};
            news.forEach(item => {
                initialCounts[item.id] = item.likes_count || 0;
            });
            setArticlesLikes(initialCounts);
        }
    }, [news]);

    const calculateReadingTime = useMemo(() => (content) => {
        const wordsPerMinute = 200;
        const words = content.split(/\s+/).length;
        return Math.ceil(words / wordsPerMinute);
    }, []);

    const isNewArticle = (date) => {
        const articleDate = new Date(date);
        const now = new Date();
        const diffDays = Math.ceil(Math.abs(now - articleDate) / (1000 * 60 * 60 * 24));
        return diffDays <= 7;
    };

    // Filtered news - Optimized
    const filteredNews = useMemo(() => {
        let filtered = news || [];

        if (searchTerm) {
            const lowerSearch = searchTerm.toLowerCase();
            filtered = filtered.filter(item =>
                item.title?.toLowerCase().includes(lowerSearch) ||
                item.content?.toLowerCase().includes(lowerSearch) ||
                item.author?.toLowerCase().includes(lowerSearch)
            );
        }

        if (filterDomain !== 'all') {
            filtered = filtered.filter(n => (n.domain_name || n.domain) === filterDomain);
        }

        return filtered;
    }, [news, searchTerm, filterDomain]);

    const handleLike = async (articleId) => {
        try {
            const apiUrl = window.location.hostname === 'localhost' ? 'http://localhost:3002' : '';
            const response = await fetch(`${apiUrl}/api/news/${articleId}/like`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });

            if (!response.ok) throw new Error('Failed to like article');

            const data = await response.json();
            setArticlesLikes(prev => ({ ...prev, [articleId]: data.likes_count }));
            setLikedArticles(prev => ({ ...prev, [articleId]: data.action === 'liked' }));
        } catch (error) {
            console.error('Error liking article:', error);
        }
    };

    return (
        <div className="animate-fadeIn">
            {/* Search Bar */}
            <div className="search-container" style={{ marginBottom: 'var(--spacing-8)' }}>
                <Search className="search-icon" size={20} />
                <input
                    type="text"
                    placeholder="Search articles by title, content, or author..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                />
            </div>

            {/* Domain Filters */}
            <div className="filter-chips">
                <button
                    onClick={() => setFilterDomain('all')}
                    className={`filter-chip ${filterDomain === 'all' ? 'active' : ''}`}
                >
                    All News
                </button>
                {domains.map(domain => (
                    <button
                        key={domain.id}
                        onClick={() => setFilterDomain(domain.name)}
                        className={`filter-chip ${filterDomain === domain.name ? 'active' : ''}`}
                        style={filterDomain === domain.name ? {
                            backgroundColor: getDomainColor(domain.name),
                            borderColor: getDomainColor(domain.name),
                            color: 'white'
                        } : {}}
                    >
                        {domain.name}
                    </button>
                ))}
            </div>

            {/* News Grid */}
            {isLoading ? (
                <div className="grid grid-cols-2">
                    <SkeletonCard />
                    <SkeletonCard />
                    <SkeletonCard />
                    <SkeletonCard />
                </div>
            ) : filteredNews.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon">
                        <Newspaper size={40} />
                    </div>
                    <h3 className="empty-state-title">No articles found</h3>
                    <p className="empty-state-text">
                        {searchTerm ? 'Try adjusting your search terms' : 'No articles available yet'}
                    </p>
                </div>
            ) : (
                <>
                    {/* Articles Counter */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: 'var(--spacing-4)',
                        padding: 'var(--spacing-3) var(--spacing-4)',
                        backgroundColor: 'var(--bg-primary)',
                        borderRadius: 'var(--radius-lg)',
                        border: '1px solid var(--border-color)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
                            <Newspaper size={18} style={{ color: 'var(--primary-600)' }} />
                            <span style={{
                                fontSize: 'var(--font-size-sm)',
                                fontWeight: 'var(--font-weight-medium)',
                                color: 'var(--text-primary)'
                            }}>
                                {filteredNews.length} article{filteredNews.length > 1 ? 's' : ''}
                                {filterDomain !== 'all' && ` in ${filterDomain}`}
                                {searchTerm && ` matching "${searchTerm}"`}
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2">
                        {filteredNews.map(item => (
                            <div key={item.id} className="card-article">
                                <div className="card-article-content">
                                    <div className="card-article-header">
                                        <span
                                            className="badge"
                                            style={{
                                                backgroundColor: getDomainColor(item.domain_name || item.domain) + '20',
                                                color: getDomainColor(item.domain_name || item.domain)
                                            }}
                                        >
                                            {item.domain_name || item.domain}
                                        </span>
                                        {isNewArticle(item.date) && (
                                            <span className="badge badge-success">New</span>
                                        )}
                                    </div>

                                    <h3 className="card-article-title">{item.title}</h3>
                                    <p className="card-article-text">{item.content}</p>

                                    <div className="card-article-footer">
                                        <div className="flex items-center gap-2">
                                            <User size={14} />
                                            <span>{item.author}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Calendar size={14} />
                                            <span>{new Date(item.date).toLocaleDateString()}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span>{calculateReadingTime(item.content)} min read</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

export default PublicView;