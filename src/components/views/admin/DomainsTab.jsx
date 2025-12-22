import React from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';

const DomainsTab = ({ domains, handleOpenNewDomain, handleEditDomain, handleDeleteDomain }) => {
  return (
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
  );
};

export default DomainsTab;