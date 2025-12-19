import React from 'react';
import { X } from 'lucide-react';

const NewsModal = ({ 
  editingNews, 
  newNews, 
  setNewNews, 
  domains, 
  currentUser,
  handleCreateNews,
  handleUpdateNews,
  handleCancelNews
}) => {
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>{editingNews ? 'Edit Article' : 'Create New Article'}</h2>
          <button 
            className="close-button"
            onClick={handleCancelNews}
          >
            <X size={24} />
          </button>
        </div>
        <form onSubmit={editingNews ? handleUpdateNews : handleCreateNews} className="modal-form">
          <div className="form-group">
            <label htmlFor="title">Title</label>
            <input
              type="text"
              id="title"
              value={newNews.title}
              onChange={(e) => setNewNews({...newNews, title: e.target.value})}
              required
              placeholder="Enter article title"
            />
          </div>
          {!editingNews && currentUser && currentUser.role !== 'contributor' && (
            <div className="form-group">
              <label htmlFor="domain">Domain</label>
              <select
                id="domain"
                value={newNews.domain}
                onChange={(e) => setNewNews({...newNews, domain: e.target.value})}
                required
              >
                <option value="">Select a domain</option>
                {domains.map(domain => (
                  <option key={domain.id} value={domain.id}>{domain.name}</option>
                ))}
              </select>
            </div>
          )}
          <div className="form-group">
            <label htmlFor="content">Content</label>
            <textarea
              id="content"
              value={newNews.content}
              onChange={(e) => setNewNews({...newNews, content: e.target.value})}
              required
              placeholder="Enter article content"
              rows="10"
            />
          </div>
          <div className="form-actions">
            <button 
              type="button" 
              onClick={handleCancelNews}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
            >
              {editingNews ? 'Update Article' : 'Create Article'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewsModal;