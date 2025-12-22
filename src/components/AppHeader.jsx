import React from 'react';
import { Newspaper, Edit, User, LogOut, Sun, Moon } from 'lucide-react';

const AppHeader = ({ 
  currentView, 
  setCurrentView, 
  currentUser, 
  darkMode, 
  toggleDarkMode, 
  setShowLogin,
  handleLogout
}) => {
  return (
    <header className="app-header">
      <div className="header-content">
        <div className="app-title-container">
          <h1 className="app-title">Newsletter App</h1>
          <span className="app-version">v1.3.0</span>
        </div>
        <nav className="navigation">
          <button 
            className={`nav-link ${currentView === 'public' ? 'active' : ''}`}
            onClick={() => setCurrentView('public')}
          >
            <Newspaper size={20} />
            Public
          </button>
          {currentUser && (
            <button 
              className={`nav-link ${currentView === 'contributor' ? 'active' : ''}`}
              onClick={() => setCurrentView('contributor')}
            >
              <Edit size={20} />
              My Articles
            </button>
          )}
          {currentUser && (currentUser.role === 'super_admin' || currentUser.role === 'domain_admin') && (
            <button 
              className={`nav-link ${currentView === 'admin' ? 'active' : ''}`}
              onClick={() => setCurrentView('admin')}
            >
              <User size={20} />
              Admin
            </button>
          )}
        </nav>
        <div className="header-actions">
          <button 
            onClick={toggleDarkMode}
            className="theme-toggle"
            aria-label="Toggle dark mode"
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          {currentUser ? (
            <div className="user-menu">
              <span className="username">{currentUser.username}</span>
              <button 
                onClick={handleLogout}
                className="btn btn-secondary"
              >
                <LogOut size={20} />
                Logout
              </button>
            </div>
          ) : (
            <button 
              onClick={() => setShowLogin(true)}
              className="btn btn-primary"
            >
              <User size={20} />
              Login
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default AppHeader;