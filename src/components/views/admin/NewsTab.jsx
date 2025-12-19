import React, { useState } from 'react';
import { Edit, Trash2, Calendar } from 'lucide-react';

const NewsTab = ({ news, domainColors, handleEditNews, handleDeleteNews }) => {
  const [expandedNews, setExpandedNews] = useState(null);
  
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const toggleExpand = (id) => {
    setExpandedNews(expandedNews === id ? null : id);
  };

  return (
    <div>
      <div className="section-header">
        <h3>All Articles</h3>
      </div>
      <div className="news-grid">
        {news.length > 0 ? (
          news.map(item => (
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
                  onClick={() => handleEditNews(item)}
                  className="btn btn-secondary"
                >
                  <Edit size={16} />
                  Edit
                </button>
                <button 
                  onClick={() => handleDeleteNews(item.id)}
                  className="btn btn-danger"
                >
                  <Trash2 size={16} />
                  Delete
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="no-results">
            <p>No articles found.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NewsTab;