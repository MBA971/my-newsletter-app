import React, { useState } from 'react';
import { Calendar } from 'lucide-react';

const ArchivedNewsTab = ({ news, domainColors, handleToggleArchiveNews }) => {
  const [expandedNews, setExpandedNews] = useState(null);
  
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const toggleExpand = (id) => {
    setExpandedNews(expandedNews === id ? null : id);
  };

  // Filter archived news
  const archivedNews = news.filter(item => item.archived);

  return (
    <div>
      <div className="section-header">
        <h3>Archived Articles</h3>
      </div>
      <div className="news-grid">
        {archivedNews.length > 0 ? (
          archivedNews.map(item => (
            <div key={item.id} className="news-card archived">
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
                  onClick={() => handleToggleArchiveNews(item.id)}
                  className="btn btn-success"
                >
                  Unarchive
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="no-results">
            <p>No archived articles.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ArchivedNewsTab;