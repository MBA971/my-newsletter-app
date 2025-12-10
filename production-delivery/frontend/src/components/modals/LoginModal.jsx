import React from 'react';
import { X, Mail, Lock, Info } from 'lucide-react';

const LoginModal = ({ show, onClose, onLogin, loginForm, setLoginForm }) => {
    if (!show) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content animate-scaleIn" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3 className="modal-title">Contributor Login</h3>
                    <button onClick={onClose} className="btn-icon">
                        <X size={20} />
                    </button>
                </div>
                <div className="text-center text-sm text-gray-500 mb-2 flex items-center justify-center">
                    <Info size={14} className="mr-1" />
                    Version 1.2.1
                </div>
                <form onSubmit={onLogin} className="modal-body">
                    <div className="form-group">
                        <label className="form-label">Email</label>
                        <div className="input-with-icon">
                            <Mail className="input-icon" size={18} />
                            <input
                                type="email"
                                value={loginForm.email}
                                onChange={e => setLoginForm({ ...loginForm, email: e.target.value })}
                                className="form-input pl-10"
                                required
                                placeholder="name@company.com"
                            />
                        </div>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Password</label>
                        <div className="input-with-icon">
                            <Lock className="input-icon" size={18} />
                            <input
                                type="password"
                                value={loginForm.password}
                                onChange={e => setLoginForm({ ...loginForm, password: e.target.value })}
                                className="form-input pl-10"
                                required
                                placeholder="••••••••"
                            />
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" onClick={onClose} className="btn btn-ghost">
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary">
                            Login
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default LoginModal;
