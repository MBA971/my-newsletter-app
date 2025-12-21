import React, { useState, useMemo } from 'react';
import { Plus, Edit, Trash2, Shield } from 'lucide-react';
import DomainModal from '../../modals/DomainModal';

const DomainsTab = ({ 
    domains, 
    currentUser, 
    onSaveDomain, 
    onDeleteDomain, 
    availableColors, 
    domainColors,
    showNotification
}) => {
    // Domain Modal State
    const [showAddDomain, setShowAddDomain] = useState(false);
    const [editingDomain, setEditingDomain] = useState(null);
    const [newDomain, setNewDomain] = useState({ name: '', color: '#3b82f6' });

    const handleEditDomain = (domain, e) => {
        e.preventDefault();
        setEditingDomain(domain);
        setNewDomain({ name: domain.name, color: domain.color });
        setShowAddDomain(true);
    };

    const handleDomainSubmit = async (e) => {
        e.preventDefault();
        const domainData = editingDomain ? { ...newDomain, id: editingDomain.id } : newDomain;
        const success = await onSaveDomain(domainData, !!editingDomain);
        if (success) closeDomainModal();
    };

    const closeDomainModal = () => {
        setShowAddDomain(false);
        setEditingDomain(null);
        setNewDomain({ name: '', color: '#3b82f6' });
    };

    // Helper function
    const getDomainColor = (domainName) => {
        if (!domainName || !domains) return '#3b82f6';
        const domain = domains.find(d => d.name === domainName);
        return domain?.color || '#3b82f6';
    };

    return (
        <div className="animate-fadeIn">
            <div className="section-header">
                <div>
                    <h2 className="section-title">Manage Domains</h2>
                    <p className="text-secondary mt-1">Configure newsletter domains and styling</p>
                </div>
                <button
                    onClick={() => setShowAddDomain(true)}
                    className="btn btn-secondary"
                >
                    <Plus size={20} />
                    Add Domain
                </button>
            </div>

            <DomainModal
                show={showAddDomain}
                onClose={closeDomainModal}
                onSave={handleDomainSubmit}
                domainData={newDomain}
                setDomainData={setNewDomain}
                isEditing={!!editingDomain}
                availableColors={availableColors}
            />

            <div className="grid-responsive">
                {domains.map(domain => (
                    <div key={domain.id} className="card group">
                        <div className="flex items-center justify-between mb-4">
                            <div
                                className="domain-icon group-hover:scale-110 transition-transform"
                                style={{ backgroundColor: getDomainColor(domain.name) }}
                            >
                                {domain.name.charAt(0)}
                            </div>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                {/* Domain admins can only edit their assigned domain */}
                                {(currentUser.role === 'super_admin' ||
                                  (currentUser.role === 'domain_admin' && domain.name === currentUser.domain)) && (
                                    <button
                                        onClick={(e) => handleEditDomain(domain, e)}
                                        className="btn-icon"
                                        style={{ color: 'var(--primary-600)' }}
                                        title="Edit domain"
                                    >
                                        <Edit size={18} />
                                    </button>
                                )}
                                {/* Only super admins can delete domains */}
                                {currentUser.role === 'super_admin' && (
                                    <button
                                        onClick={() => onDeleteDomain(domain.id)}
                                        className="btn-icon"
                                        style={{ color: 'var(--error-600)' }}
                                        title="Delete domain"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                )}
                            </div>
                        </div>
                        <h3 className="text-xl font-bold mb-1">{domain.name}</h3>
                        <div className="flex items-center justify-between text-sm text-tertiary">
                            <span>{domain.articlecount || domain.articleCount || 0} articles</span>
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--success-500)' }}></div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default DomainsTab;