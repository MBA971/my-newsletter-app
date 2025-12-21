import React from 'react';
import { X, Mail, Lock, Info, LogIn } from 'lucide-react';

const LoginModal = ({ show, onClose, onLogin, loginForm, setLoginForm }) => {
    if (!show) return null;

    return (
        <div className="modal-overlay glass-dark" onClick={onClose}>
            <div className="modal-content glass animate-scaleIn" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
                <div className="modal-header border-none pb-0">
                    <div className="w-12 h-12 rounded-2xl bg-primary-500 text-white flex items-center justify-center shadow-lg mb-4 mx-auto">
                        <LogIn size={24} />
                    </div>
                    <h3 className="modal-title w-full text-center text-2xl font-bold">Welcome Back</h3>
                    <p className="text-center text-tertiary text-sm mt-1">Sign in to manage your newsletter</p>
                    <button onClick={onClose} className="btn-icon absolute top-4 right-4 text-tertiary hover:text-primary-500 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={onLogin} className="modal-body pt-6">
                    <div className="form-group">
                        <label className="form-label text-xs font-bold uppercase tracking-wider text-tertiary">Email Address</label>
                        <div className="input-with-icon">
                            <Mail className="input-icon" size={18} />
                            <input
                                type="email"
                                value={loginForm.email}
                                onChange={e => setLoginForm({ ...loginForm, email: e.target.value })}
                                className="form-input glass pl-10 h-12"
                                required
                                placeholder="name@company.com"
                            />
                        </div>
                    </div>
                    <div className="form-group mb-8">
                        <label className="form-label text-xs font-bold uppercase tracking-wider text-tertiary">Password</label>
                        <div className="input-with-icon">
                            <Lock className="input-icon" size={18} />
                            <input
                                type="password"
                                value={loginForm.password}
                                onChange={e => setLoginForm({ ...loginForm, password: e.target.value })}
                                className="form-input glass pl-10 h-12"
                                required
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <button type="submit" className="btn btn-primary w-full h-12 shadow-primary text-lg font-bold">
                        Sign In
                    </button>

                    <div className="text-center mt-6">
                        <span className="text-xs text-tertiary flex items-center justify-center gap-1">
                            <Info size={12} /> Version 1.4.0
                        </span>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default LoginModal;
