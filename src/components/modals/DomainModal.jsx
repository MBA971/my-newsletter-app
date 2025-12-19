import React from 'react';
import { X } from 'lucide-react';

const DomainModal = ({ 
  editingDomain, 
  newDomain, 
  setNewDomain,
  availableColors,
  handleCreateDomain,
  handleUpdateDomain,
  handleCancelDomain
}) => {
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>{editingDomain ? 'Edit Domain' : 'Create New Domain'}</h2>
          <button 
            className="close-button"
            onClick={handleCancelDomain}
          >
            <X size={24} />
          </button>
        </div>
        <form onSubmit={editingDomain ? handleUpdateDomain : handleCreateDomain} className="modal-form">
          <div className="form-group">
            <label htmlFor="name">Domain Name</label>
            <input
              type="text"
              id="name"
              value={newDomain.name}
              onChange={(e) => setNewDomain({...newDomain, name: e.target.value})}
              required
              placeholder="Enter domain name"
            />
          </div>
          <div className="form-group">
            <label>Color</label>
            <div className="color-options">
              {availableColors.map(color => (
                <label key={color.name} className="color-option">
                  <input
                    type="radio"
                    name="color"
                    value={color.value}
                    checked={newDomain.color === color.value}
                    onChange={(e) => setNewDomain({...newDomain, color: e.target.value})}
                  />
                  <span 
                    className="color-preview" 
                    style={{ backgroundColor: color.value }}
                  >
                    {newDomain.color === color.value && '✓'}
                  </span>
                  {color.name}
                </label>
              ))}
            </div>
          </div>
          <div className="form-actions">
            <button 
              type="button" 
              onClick={handleCancelDomain}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
            >
              {editingDomain ? 'Update Domain' : 'Create Domain'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DomainModal;