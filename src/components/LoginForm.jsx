import React from 'react';
import { User, Lock } from 'lucide-react';

const LoginForm = ({ loginForm, setLoginForm, handleLogin, setShowLogin }) => {
  return (
    <div className="modal-overlay">
      <div className="modal-content login-modal">
        <div className="modal-header">
          <h2>Login to Newsletter App</h2>
          <button 
            className="close-button"
            onClick={() => setShowLogin(false)}
          >
            ×
          </button>
        </div>
        <form onSubmit={handleLogin} className="login-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <div className="input-with-icon">
              <User size={20} className="input-icon" />
              <input
                type="email"
                id="email"
                value={loginForm.email}
                onChange={(e) => setLoginForm({...loginForm, email: e.target.value})}
                required
                placeholder="Enter your email"
              />
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="input-with-icon">
              <Lock size={20} className="input-icon" />
              <input
                type="password"
                id="password"
                value={loginForm.password}
                onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                required
                placeholder="Enter your password"
              />
            </div>
          </div>
          <button type="submit" className="btn btn-primary login-button">
            Login
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginForm;