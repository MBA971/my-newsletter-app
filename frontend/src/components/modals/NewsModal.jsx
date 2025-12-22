import React, { useMemo, useState, useEffect } from 'react';
import { X, FileText, Heading, Briefcase, AlignLeft } from 'lucide-react';

const NewsModal = ({ show, onClose, onSave, newsData, setNewsData, isEditing, currentUser, domains, showNotification }) => {
    console.log('[DEBUG] NewsModal received props:', { show, newsData, isEditing, currentUser, domains });
    console.log('[DEBUG] NewsModal - newsData contents:', JSON.stringify(newsData, null, 2));

    // Character counter state
    const [charCount, setCharCount] = useState(newsData?.content ? newsData.content.length : 0);
    const MAX_CHARS = 5000;

    // Update character count when content changes
    useEffect(() => {
        setCharCount(newsData?.content ? newsData.content.length : 0);
    }, [newsData?.content]);

    const domainOptions = useMemo(() => {
        console.log('[DEBUG] Processing domainOptions - domains:', domains);
        if (!domains || !Array.isArray(domains)) {
            console.log('[DEBUG] domainOptions - returning empty array due to invalid domains');
            return [];
        }
        const filteredDomains = domains.filter(d => d && d.id && d.name); // Filter out invalid domains
        console.log('[DEBUG] domainOptions - filtered domains:', filteredDomains);
        // Log each domain for debugging
        filteredDomains.forEach((domain, index) => {
            console.log(`[DEBUG] domainOptions - domain[${index}]:`, domain);
        });
        return filteredDomains;
    }, [domains]);

    const getDomainNameById = useMemo(() => (domainId) => {
        console.log('[DEBUG] getDomainNameById called with:', domainId, 'Type:', typeof domainId);
        if (!domainOptions.length || domainId === undefined || domainId === null || domainId === '') {
            console.log('[DEBUG] getDomainNameById - Returning empty due to invalid input');
            return '';
        }
        const id = typeof domainId === 'string' ? parseInt(domainId, 10) : domainId;
        if (isNaN(id)) {
            console.log('[DEBUG] getDomainNameById - Returning empty due to NaN');
            return '';
        }
        const domain = domainOptions.find(d => d.id === id);
        const result = domain ? domain.name : '';
        console.log('[DEBUG] getDomainNameById - id:', id, 'Found domain:', domain, 'Result:', result);
        return result;
    }, [domainOptions]);

    const getDomainIdByName = useMemo(() => (domainName) => {
        if (!domainOptions.length || !domainName) {
            console.log('[DEBUG] getDomainIdByName - Invalid input - domainOptions.length:', domainOptions.length, 'domainName:', domainName);
            return null; // Return null instead of empty string for better validation
        }
        const domain = domainOptions.find(d => d.name === domainName);
        const result = domain ? domain.id : null; // Return null instead of empty string for better validation
        console.log('[DEBUG] getDomainIdByName - domainName:', domainName, 'Found domain:', domain, 'Result:', result);
        return result;
    }, [domainOptions]);

    const selectedDomainName = useMemo(() => {
        if (!currentUser || currentUser.role !== 'super_admin') return '';
        const domainName = getDomainNameById(newsData?.domain_id);
        console.log('[DEBUG] Computing selectedDomainName - newsData.domain_id:', newsData?.domain_id, 'Result:', domainName);
        return domainName;
    }, [newsData?.domain_id, getDomainNameById, currentUser?.role]);

    const handleDomainChange = (e) => {
        const domainName = e.target.value;
        const domainId = getDomainIdByName(domainName);
        console.log('[DEBUG] Domain selection changed - Name:', domainName, 'ID:', domainId, 'Type:', typeof domainId);
        const newData = { ...newsData, domain_id: domainId };
        console.log('[DEBUG] Setting newsData to:', newData);
        setNewsData(newData);
    };

    const handleContentChange = (e) => {
        const content = e.target.value;
        // Only update if within character limit
        if (content.length <= MAX_CHARS) {
            setNewsData({ ...newsData, content });
        }
    };

    // Early return if not showing or missing required props
    if (!show || !onClose || !onSave || !setNewsData || !currentUser) {
        return null;
    }

    // Prevent form submission if super admin hasn't selected a domain
    const handleSubmit = (e) => {
        e.preventDefault();
        
        // For super admins, they should be able to create articles in any domain
        // They must still select a domain, but they have elevated permissions
        const domainId = newsData?.domain_id;
        const isValidDomain = domainId !== undefined && domainId !== null && domainId !== '' && domainId !== 0;
        
        console.log('[DEBUG] Form submission - Domain ID:', domainId, 'Type:', typeof domainId, 'Is Valid:', isValidDomain);
        
        // Super admins must still select a domain (but they can select any domain)
        if (currentUser.role === 'super_admin' && !isValidDomain) {
            // Show error and prevent submission
            if (typeof showNotification === 'function') {
                showNotification('Please select a domain for this article', 'error');
            } else {
                alert('Please select a domain for this article');
            }
            return;
        }
        
        // Proceed with normal save
        onSave(newsData);
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

                <form onSubmit={handleSubmit} className="modal-body space-y-5 pt-6">
                    <div className="form-group">
                        <label className="form-label text-xs font-bold uppercase tracking-wider text-tertiary">Article Title</label>
                        <div className="input-with-icon">
                            <Heading className="input-icon" size={18} />
                            <input
                                type="text"
                                value={newsData?.title || ''}
                                onChange={e => setNewsData({ ...newsData, title: e.target.value })}
                                className="form-input glass pl-10 h-11"
                                required
                                placeholder="E.g., New Feature Launch"
                            />
                        </div>
                    </div>

                    {currentUser.role === 'super_admin' && (
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

                    {(currentUser.role === 'contributor' || currentUser.role === 'domain_admin') && (
                        <div className="form-group">
                            <label className="form-label text-xs font-bold uppercase tracking-wider text-tertiary">Target Domain</label>
                            <div className="input-with-icon">
                                <Briefcase className="input-icon" size={18} />
                                <input
                                    type="text"
                                    value={getDomainNameById(isEditing ? newsData?.domain_id : currentUser?.domain_id) || 'No domain assigned'}
                                    className="form-input glass pl-10 h-11 bg-gray-100 cursor-not-allowed"
                                    readOnly
                                    placeholder="Domain assigned by admin"
                                />
                            </div>
                        </div>
                    )}

                    <div className="form-group">
                        <label className="form-label text-xs font-bold uppercase tracking-wider text-tertiary">Content</label>
                        <div className="relative">
                            <AlignLeft className="absolute top-3 left-3 text-tertiary" size={18} />
                            <textarea
                                value={newsData?.content || ''}
                                onChange={handleContentChange}
                                className="form-textarea glass pl-10 pt-3 min-h-[200px]"
                                required
                                placeholder="Write your content here..."
                                maxLength={MAX_CHARS}
                            />
                        </div>
                        <div className="flex justify-between items-center mt-2">
                            <div className={`text-sm ${charCount > MAX_CHARS * 0.9 ? 'text-error-500' : 'text-tertiary'}`}>
                                {charCount}/{MAX_CHARS} characters
                            </div>
                            {charCount > MAX_CHARS * 0.9 && (
                                <div className="text-sm text-error-500">
                                    Approaching character limit
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="modal-footer border-none pt-4">
                        <button type="button" onClick={onClose} className="btn btn-ghost glass h-11 px-6">
                            Discard
                        </button>
                        <button
                            type="submit"
                            className="btn btn-success h-11 px-8 shadow-success font-bold"
                            disabled={charCount > MAX_CHARS || (currentUser.role === 'contributor' && !currentUser.domain_id)}
                        >
                            {isEditing ? 'Update Article' : 'Publish News'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default NewsModal;