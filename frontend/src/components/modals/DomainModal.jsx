import React from 'react';
import { X, Check, Shield, Palette, Type } from 'lucide-react';

const DomainModal = ({ show, onClose, onSave, domainData, setDomainData, isEditing, availableColors }) => {
    if (!show) return null;

    return (
        <div className="modal-overlay glass-dark" onClick={onClose}>
            <div className="modal-content glass animate-scaleIn" onClick={e => e.stopPropagation()} style={{ maxWidth: '480px' }}>
                <div className="modal-header">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-secondary-500 text-white flex items-center justify-center shadow-lg">
                            <Shield size={20} />
                        </div>
                        <div>
                            <h3 className="modal-title text-xl font-bold">{isEditing ? 'Edit Domain' : 'New Domain'}</h3>
                            <p className="text-tertiary text-xs">Define a unique category for your news</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="btn-icon text-tertiary hover:text-primary-500 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={onSave} className="modal-body space-y-6 pt-6">
                    <div className="form-group">
                        <label className="form-label text-xs font-bold uppercase tracking-wider text-tertiary">Domain Identity</label>
                        <div className="input-with-icon">
                            <Type className="input-icon" size={18} />
                            <input
                                type="text"
                                placeholder="e.g., Engineering, Culture"
                                value={domainData.name}
                                onChange={e => setDomainData({ ...domainData, name: e.target.value })}
                                className="form-input glass pl-10 h-11 text-lg font-medium"
                                required
                                autoFocus
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label text-xs font-bold uppercase tracking-wider text-tertiary flex items-center gap-2">
                            <Palette size={14} /> Brand Color
                        </label>
                        <div className="grid grid-cols-4 gap-4 mt-3">
                            {availableColors.map(color => {
                                const isSelected = domainData.color === color.value;
                                return (
                                    <button
                                        key={color.value}
                                        type="button"
                                        onClick={() => setDomainData({ ...domainData, color: color.value })}
                                        className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all duration-300 ${isSelected ? 'border-primary-500 bg-white shadow-md scale-105' : 'border-transparent hover:bg-white/50'}`}
                                    >
                                        <div
                                            className="w-10 h-10 rounded-full flex items-center justify-center shadow-sm mb-2"
                                            style={{ backgroundColor: color.value }}
                                        >
                                            {isSelected && <Check size={18} color="white" strokeWidth={3} />}
                                        </div>
                                        <span className={`text-[10px] font-bold uppercase tracking-tighter ${isSelected ? 'text-primary-600' : 'text-tertiary'}`}>
                                            {color.name}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="modal-footer border-none pt-4">
                        <button type="button" onClick={onClose} className="btn btn-ghost glass h-11 px-6">
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary h-11 px-8 shadow-primary font-bold">
                            {isEditing ? 'Save Changes' : 'Create Domain'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default DomainModal;
