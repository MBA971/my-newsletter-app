import React from 'react';
import { X, Check } from 'lucide-react';

const DomainModal = ({ show, onClose, onSave, domainData, setDomainData, isEditing, availableColors }) => {
    if (!show) return null;

    return (
        <div className="modal-overlay" onClick={onClose} style={{ backdropFilter: 'blur(4px)' }}>
            <div
                className="modal-content animate-scaleIn"
                onClick={e => e.stopPropagation()}
                style={{ maxWidth: '480px' }}
            >
                <div className="modal-header">
                    <div>
                        <h3 className="modal-title">{isEditing ? 'Edit Domain' : 'Create Domain'}</h3>
                        <p className="modal-subtitle" style={{ margin: '4px 0 0', color: 'var(--text-tertiary)' }}>
                            {isEditing ? 'Update domain details' : 'Add a new category'}
                        </p>
                    </div>
                    <button onClick={onClose} className="btn-icon">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={onSave} className="modal-body">
                    <div className="form-group">
                        <label className="form-label">Domain Name</label>
                        <input
                            type="text"
                            placeholder="e.g. Technology"
                            value={domainData.name}
                            onChange={e => setDomainData({ ...domainData, name: e.target.value })}
                            className="form-input"
                            required
                            autoFocus
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Brand Color</label>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(4, 1fr)',
                            gap: '16px',
                            marginTop: '12px'
                        }}>
                            {availableColors.map(color => {
                                const isSelected = domainData.color === color.value;
                                return (
                                    <button
                                        key={color.value}
                                        type="button"
                                        onClick={() => setDomainData({ ...domainData, color: color.value })}
                                        style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            padding: '12px',
                                            borderRadius: 'var(--radius-lg)',
                                            border: isSelected ? `2px solid ${color.value}` : '2px solid transparent',
                                            backgroundColor: isSelected ? `${color.value}15` : 'transparent',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease',
                                            position: 'relative'
                                        }}
                                        className={!isSelected ? "btn-ghost" : ""}
                                    >
                                        <div
                                            style={{
                                                width: '40px',
                                                height: '40px',
                                                borderRadius: '50%',
                                                backgroundColor: color.value,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                marginBottom: '8px',
                                                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                                                transform: isSelected ? 'scale(1.1)' : 'scale(1)',
                                                transition: 'transform 0.2s ease'
                                            }}
                                        >
                                            {isSelected && <Check size={20} color="white" strokeWidth={3} />}
                                        </div>
                                        <span style={{
                                            fontSize: '11px',
                                            fontWeight: isSelected ? '700' : '500',
                                            color: isSelected ? color.value : 'var(--text-secondary)',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.5px'
                                        }}>
                                            {color.name}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button type="button" onClick={onClose} className="btn btn-ghost">
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary">
                            {isEditing ? 'Save Changes' : 'Create Domain'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default DomainModal;
