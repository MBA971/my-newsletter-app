import React, { useState } from 'react';
import { Plus, Edit, Trash2, Calendar } from 'lucide-react';

const ContributorView = ({ 
  contributorNews, 
  domainColors, 
  handleOpenNewNews, 
  handleEditNews, 
  handleDeleteNews,
  testFetchContributorData 
}) => {
  console.log('Rendering ContributorView with contributorNews:', contributorNews);
  console.log('Number of articles in contributorNews:', contributorNews.length);
  
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Function to get status badge for an article
  const getStatusBadge = (article) => {
    if (article.archived) {
      return <span className="status-badge archived">Archived</span>;
    } else if (article.pending_validation) {
      return <span className="status-badge pending">Pending Validation</span>;
    } else {
      return <span className="status-badge published">Published</span>;
    }
  };

  return (
    <div className="animate-fadeIn">
      <div className="section-header">
        <h2 className="section-title">Manage Your Articles</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={handleOpenNewNews}
            className="btn btn-success"
          >
            <Plus size={20} />
            Add Article
          </button>
          <button
            onClick={testFetchContributorData}
            className="btn btn-secondary"
            style={{ marginLeft: '10px' }}
          >
            Test Fetch
          </button>
        </div>
      </div>

      <div className="news-grid">
        {contributorNews && contributorNews.length > 0 ? (
          contributorNews.map((article) => (
            <div key={article.id} className="news-card">
              <div className="news-card-header">
                <span 
                  className="domain-tag" 
                  style={{ backgroundColor: domainColors[article.domain] || '#6b7280' }}
                >
                  {article.domain}
                </span>
                <span className="news-date">
                  <Calendar size={16} />
                  {formatDate(article.date)}
                </span>
              </div>
              <h3 className="news-title">{article.title}</h3>
              <div className="news-content">
                <p>{article.content.substring(0, 150)}...</p>
              </div>
              <div className="news-meta">
                {getStatusBadge(article)}
              </div>
              <div className="news-actions">
                <button 
                  onClick={() => handleEditNews(article)}
                  className="btn btn-secondary"
                >
                  <Edit size={16} />
                  Edit
                </button>
                <button 
                  onClick={() => handleDeleteNews(article.id)}
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
            <p>You haven't created any articles yet.</p>
            <button
              onClick={handleOpenNewNews}
              className="btn btn-success"
              style={{ marginTop: '10px' }}
            >
              <Plus size={20} />
              Create Your First Article
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContributorView;