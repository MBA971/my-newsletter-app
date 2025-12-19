import React, { useMemo } from 'react';
import { X, FileText, Heading, Briefcase, AlignLeft } from 'lucide-react';

const NewsModal = ({ show, onClose, onSave, newsData, setNewsData, isEditing, currentUser, domains }) => {
    if (!show) return null;

    const domainOptions = useMemo(() => {
        if (!domains || !Array.isArray(domains)) return [];
        return domains;
    }, [domains]);

    const getDomainNameById = useMemo(() => (domainId) => {
        if (!domainOptions.length || domainId === undefined || domainId === null || domainId === '') return '';
        const id = typeof domainId === 'string' ? parseInt(domainId, 10) : domainId;
        if (isNaN(id)) return '';
        const domain = domainOptions.find(d => d.id === id);
        return domain ? domain.name : '';
    }, [domainOptions]);

    const getDomainIdByName = useMemo(() => (domainName) => {
        if (!domainOptions.length || !domainName) return '';
        const domain = domainOptions.find(d => d.name === domainName);
        return domain ? domain.id : '';
    }, [domainOptions]);

    const selectedDomainName = useMemo(() => {
        if (currentUser.role !== 'super_admin' && currentUser.role !== 'domain_admin') return '';
        if (typeof newsData.domain === 'string' && domainOptions.some(d => d.name === newsData.domain)) {
            return newsData.domain;
        } else {
            return getDomainNameById(newsData.domain);
        }
    }, [newsData.domain, getDomainNameById, currentUser.role, domainOptions]);

    const handleDomainChange = (e) => {
        const domainName = e.target.value;
        const domainId = getDomainIdByName(domainName);
        setNewsData({ ...newsData, domain: domainId });
    };

    return (
        <div className="modal-overlay glass-dark" onClick={onClose}>
            <div className="modal-content glass animate-scaleIn" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
                <div className="modal-header">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-success-500 text-white flex items-center justify-center shadow-lg">
                            <FileText size={20} />
                        </div>
                        <div>
                            <h3 className="modal-title text-xl font-bold">{isEditing ? 'Edit Article' : 'Compose News'}</h3>
                            <p className="text-tertiary text-xs">Craft a compelling message for your team</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="btn-icon text-tertiary hover:text-primary-500 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={onSave} className="modal-body space-y-5 pt-6">
                    <div className="form-group">
                        <label className="form-label text-xs font-bold uppercase tracking-wider text-tertiary">Article Title</label>
                        <div className="input-with-icon">
                            <Heading className="input-icon" size={18} />
                            <input
                                type="text"
                                value={newsData.title || ''}
                                onChange={e => setNewsData({ ...newsData, title: e.target.value })}
                                className="form-input glass pl-10 h-11"
                                required
                                placeholder="E.g., New Feature Launch"
                            />
                        </div>
                    </div>

                    {(currentUser.role === 'super_admin' || currentUser.role === 'domain_admin') && (
                        <div className="form-group">
                            <label className="form-label text-xs font-bold uppercase tracking-wider text-tertiary">Target Domain</label>
                            <div className="input-with-icon">
                                <Briefcase className="input-icon" size={18} />
                                <select
                                    value={selectedDomainName}
                                    onChange={handleDomainChange}
                                    className="form-select glass pl-10 h-11"
                                    required
                                >
                                    <option value="">Select Category</option>
                                    {domainOptions.map(domain => (
                                        <option key={domain.id} value={domain.name}>{domain.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}

                    <div className="form-group">
                        <label className="form-label text-xs font-bold uppercase tracking-wider text-tertiary">Content</label>
                        <div className="relative">
                            <AlignLeft className="absolute top-3 left-3 text-tertiary" size={18} />
                            <textarea
                                value={newsData.content || ''}
                                onChange={e => setNewsData({ ...newsData, content: e.target.value })}
                                className="form-textarea glass pl-10 pt-3 min-h-[200px]"
                                required
                                placeholder="Write your content here..."
                            />
                        </div>
                    </div>

                    <div className="modal-footer border-none pt-4">
                        <button type="button" onClick={onClose} className="btn btn-ghost glass h-11 px-6">
                            Discard
                        </button>
                        <button type="submit" className="btn btn-success h-11 px-8 shadow-success font-bold">
                            {isEditing ? 'Update Article' : 'Publish News'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default NewsModal;