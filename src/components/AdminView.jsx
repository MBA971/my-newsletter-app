import React, { useState } from 'react';
import { Plus, Edit, Trash2, User, Mail, Calendar } from 'lucide-react';

const AdminView = ({ 
  users, 
  subscribers, 
  domains, 
  domainColors,
  news,
  handleOpenNewUser,
  handleEditUser,
  handleDeleteUser,
  handleOpenNewDomain,
  handleEditDomain,
  handleDeleteDomain,
  handleValidateNews,
  handleToggleArchiveNews
}) => {
  const [activeTab, setActiveTab] = useState('users');
  const [expandedNews, setExpandedNews] = useState(null);

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const toggleExpand = (id) => {
    setExpandedNews(expandedNews === id ? null : id);
  };

  // Filter news for pending validation
  const pendingValidationNews = news.filter(item => item.pending_validation && !item.archived);
  
  // Filter archived news
  const archivedNews = news.filter(item => item.archived);

  return (
    <div className="animate-fadeIn">
      <div className="section-header">
        <h2 className="section-title">Administration Panel</h2>
      </div>

      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          <User size={16} />
          Users ({users.length})
        </button>
        <button 
          className={`tab ${activeTab === 'domains' ? 'active' : ''}`}
          onClick={() => setActiveTab('domains')}
        >
          Domains ({domains.length})
        </button>
        <button 
          className={`tab ${activeTab === 'subscribers' ? 'active' : ''}`}
          onClick={() => setActiveTab('subscribers')}
        >
          <Mail size={16} />
          Subscribers ({subscribers.length})
        </button>
        <button 
          className={`tab ${activeTab === 'validation' ? 'active' : ''}`}
          onClick={() => setActiveTab('validation')}
        >
          Pending Validation ({pendingValidationNews.length})
        </button>
        <button 
          className={`tab ${activeTab === 'archived' ? 'active' : ''}`}
          onClick={() => setActiveTab('archived')}
        >
          Archived ({archivedNews.length})
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'users' && (
          <div>
            <div className="section-header">
              <h3>Manage Users</h3>
              <button
                onClick={handleOpenNewUser}
                className="btn btn-success"
              >
                <Plus size={20} />
                Add User
              </button>
            </div>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Username</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Domain</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user.id}>
                      <td>{user.username}</td>
                      <td>{user.email}</td>
                      <td>
                        <span className={`role-badge ${user.role}`}>
                          {user.role}
                        </span>
                      </td>
                      <td>{user.domain || 'N/A'}</td>
                      <td>
                        <button 
                          onClick={() => handleEditUser(user)}
                          className="btn btn-secondary"
                        >
                          <Edit size={16} />
                        </button>
                        <button 
                          onClick={() => handleDeleteUser(user.id)}
                          className="btn btn-danger"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'domains' && (
          <div>
            <div className="section-header">
              <h3>Manage Domains</h3>
              <button
                onClick={handleOpenNewDomain}
                className="btn btn-success"
              >
                <Plus size={20} />
                Add Domain
              </button>
            </div>
            <div className="domains-grid">
              {domains.map(domain => (
                <div key={domain.id} className="domain-card">
                  <div 
                    className="domain-color-preview" 
                    style={{ backgroundColor: domain.color }}
                  ></div>
                  <h4>{domain.name}</h4>
                  <div className="domain-actions">
                    <button 
                      onClick={() => handleEditDomain(domain)}
                      className="btn btn-secondary"
                    >
                      <Edit size={16} />
                    </button>
                    <button 
                      onClick={() => handleDeleteDomain(domain.id)}
                      className="btn btn-danger"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'subscribers' && (
          <div>
            <div className="section-header">
              <h3>Newsletter Subscribers</h3>
            </div>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Subscription Date</th>
                  </tr>
                </thead>
                <tbody>
                  {subscribers.map(subscriber => (
                    <tr key={subscriber.id}>
                      <td>{subscriber.name || 'N/A'}</td>
                      <td>{subscriber.email}</td>
                      <td>{formatDate(subscriber.subscribed_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'validation' && (
          <div>
            <div className="section-header">
              <h3>Articles Pending Validation</h3>
            </div>
            <div className="news-grid">
              {pendingValidationNews.length > 0 ? (
                pendingValidationNews.map(item => (
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
                        onClick={() => handleValidateNews(item.id)}
                        className="btn btn-success"
                      >
                        Validate
                      </button>
                      <button 
                        onClick={() => handleToggleArchiveNews(item.id)}
                        className="btn btn-warning"
                      >
                        Archive
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-results">
                  <p>No articles pending validation.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'archived' && (
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
        )}
      </div>
    </div>
  );
};

export default AdminView;