import React from 'react';
import { X } from 'lucide-react';

const NewsModal = ({ show, onClose, onSave, newsData, setNewsData, isEditing, currentUser, domainColors }) => {
    if (!show) return null;

    const domains = Object.keys(domainColors);

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content animate-scaleIn" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3 className="modal-title">{isEditing ? 'Edit News' : 'Add News'}</h3>
                    <button onClick={onClose} className="btn-icon">
                        <X size={20} />
                    </button>
                </div>
                <form onSubmit={onSave} className="modal-body">
                    <div className="form-group">
                        <label className="form-label">Title</label>
                        <input
                            type="text"
                            value={newsData.title}
                            onChange={e => setNewsData({ ...newsData, title: e.target.value })}
                            className="form-input"
                            required
                        />
                    </div>

                    {(currentUser.role === 'admin' || !currentUser.domain) && (
                        <div className="form-group">
                            <label className="form-label">Target Domain</label>
                            <select
                                value={newsData.domain}
                                onChange={e => setNewsData({ ...newsData, domain: e.target.value })}
                                className="form-select"
                                required
                            >
                                <option value="">Select Domain</option>
                                {domains.map(domain => (
                                    <option key={domain} value={domain}>{domain}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className="form-group">
                        <label className="form-label">Content</label>
                        <textarea
                            value={newsData.content}
                            onChange={e => setNewsData({ ...newsData, content: e.target.value })}
                            className="form-textarea"
                            rows={6}
                            required
                        />
                    </div>

                    <div className="modal-footer">
                        <button type="button" onClick={onClose} className="btn btn-ghost">
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary">
                            {isEditing ? 'Update News' : 'Post News'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default NewsModal;
