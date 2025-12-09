import React, { useState } from 'react';
import { Search, Newspaper, User, Calendar } from 'lucide-react';
import SkeletonCard from '../ui/SkeletonCard';

const PublicView = ({ news, domains, isLoading }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterDomain, setFilterDomain] = useState('all');

    // Domain colors mapping (could be passed as prop or imported config)
    const domainColors = {
        'Hiring': '#3b82f6',
        'Event': '#8b5cf6',
        'Journey': '#22c55e',
        'Communication': '#f97316',
        'Admin': '#ef4444'
    };

    const getDomainColor = (domainName) => {
        const domain = domains.find(d => d.name === domainName);
        return domain?.color || domainColors[domainName] || '#3b82f6';
    };

    const calculateReadingTime = (content) => {
        const wordsPerMinute = 200;
        const words = content.split(' ').length;
        return Math.ceil(words / wordsPerMinute);
    };

    const isNewArticle = (date) => {
        const articleDate = new Date(date);
        const now = new Date();
        const diffTime = Math.abs(now - articleDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 7;
    };

    const getFilteredNews = () => {
        const filtered = news.filter(item =>
            item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.author.toLowerCase().includes(searchTerm.toLowerCase())
        );

        if (filterDomain === 'all') return filtered;
        return filtered.filter(n => (n.domain_name || n.domain) === filterDomain);
    };

    const filteredNews = getFilteredNews();

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
