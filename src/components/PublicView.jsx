import React, { useState } from 'react';
import { Search, Calendar, Mail } from 'lucide-react';

const PublicView = ({ news, domains, domainColors, searchTerm, setSearchTerm, filterDomain, setFilterDomain, handleLikeNews }) => {
  const [expandedNews, setExpandedNews] = useState(null);

  const filteredNews = news.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDomain = filterDomain === 'all' || item.domain === filterDomain;
    return matchesSearch && matchesDomain;
  });

  const toggleExpand = (id) => {
    setExpandedNews(expandedNews === id ? null : id);
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div className="animate-fadeIn">
      <div className="section-header">
        <h2 className="section-title">Latest News</h2>
        <div className="search-container">
          <div className="search-wrapper">
            <Search size={20} className="search-icon" />
            <input
              type="text"
              placeholder="Search articles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          <select
            value={filterDomain}
            onChange={(e) => setFilterDomain(e.target.value)}
            className="domain-filter"
          >
            <option value="all">All Domains</option>
            {domains.map(domain => (
              <option key={domain.id} value={domain.name}>{domain.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="news-grid">
        {filteredNews.length > 0 ? (
          filteredNews.map((item) => (
            <div key={item.id} className="news-card">
              <div className="news-card-header">
                <span 
                  className="domain-tag" 
                  style={{ backgroundColor: domainColors[item.domain] || '#6b7280' }}
                >
                  {item.domain}
                </span>
                <span className="news-date">
                  <Calendar size={16} />
                  {formatDate(item.date)}
                </span>
              </div>
              <h3 className="news-title">{item.title}</h3>
              <div className="news-content">
                {expandedNews === item.id ? (
                  <div dangerouslySetInnerHTML={{ __html: item.content }} />
                ) : (
                  <p>{item.content.substring(0, 150)}...</p>
                )}
              </div>
              <div className="news-actions">
                <button 
                  onClick={() => toggleExpand(item.id)}
                  className="btn btn-secondary"
                >
                  {expandedNews === item.id ? 'Show Less' : 'Read More'}
                </button>
                <button 
                  onClick={() => handleLikeNews(item.id)}
                  className="btn btn-like"
                >
                  <Mail size={16} />
                  Like ({item.likes_count})
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="no-results">
            <p>No articles found matching your criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicView;