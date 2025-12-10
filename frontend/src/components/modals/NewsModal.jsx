import React, { useMemo } from 'react';
import { X } from 'lucide-react';

const NewsModal = ({ show, onClose, onSave, newsData, setNewsData, isEditing, currentUser, domains }) => {
    if (!show) return null;

    // Memoize domain calculations to prevent unnecessary re-renders
    const domainOptions = useMemo(() => {
        if (!domains || !Array.isArray(domains)) return [];
        return domains;
    }, [domains]);

    // Convert domain ID to domain name for display
    const getDomainNameById = useMemo(() => (domainId) => {
        // Only process if we have domain options and a valid domainId
        if (!domainOptions.length || domainId === undefined || domainId === null || domainId === '') {
            return '';
        }
        
        // Handle both string and number domain IDs
        const id = typeof domainId === 'string' ? parseInt(domainId, 10) : domainId;
        
        if (isNaN(id)) {
            return '';
        }
        
        const domain = domainOptions.find(d => d.id === id);
        return domain ? domain.name : '';
    }, [domainOptions]);

    // Convert domain name to domain ID for submission
    const getDomainIdByName = useMemo(() => (domainName) => {
        if (!domainOptions.length || !domainName) {
            return '';
        }
        
        const domain = domainOptions.find(d => d.name === domainName);
        return domain ? domain.id : '';
    }, [domainOptions]);

    // Get the domain name for the select value (only for admin)
    const selectedDomainName = useMemo(() => {
        // Only calculate selected domain name for admin users
        if (currentUser.role !== 'admin') {
            return '';
        }
        
        // If newsData.domain is already a name (string), use it directly
        // Otherwise, convert the ID to a name
        if (typeof newsData.domain === 'string' && domainOptions.some(d => d.name === newsData.domain)) {
            return newsData.domain;
        } else {
            return getDomainNameById(newsData.domain);
        }
    }, [newsData.domain, getDomainNameById, currentUser.role, domainOptions]);

    // Handle domain selection change (only for admin)
    const handleDomainChange = (e) => {
        const domainName = e.target.value;
        const domainId = getDomainIdByName(domainName);
        setNewsData({ ...newsData, domain: domainId });
    };

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
                            value={newsData.title || ''}
                            onChange={e => setNewsData({ ...newsData, title: e.target.value })}
                            className="form-input"
                            required
                        />
                    </div>

                    {(currentUser.role === 'admin') && (
                        <div className="form-group">
                            <label className="form-label">Target Domain</label>
                            <select
                                value={selectedDomainName}
                                onChange={handleDomainChange}
                                className="form-select"
                                required
                            >
                                <option value="">Select Domain</option>
                                {domainOptions.map(domain => (
                                    <option key={domain.id} value={domain.name}>{domain.name}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className="form-group">
                        <label className="form-label">Content</label>
                        <textarea
                            value={newsData.content || ''}
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