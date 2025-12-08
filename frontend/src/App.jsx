import React, { useState, useEffect } from 'react';
import { User, LogOut, Sun, Moon, Newspaper, Mail } from 'lucide-react';
import './App.css';

// Services
import { auth, domains as domainsApi, news as newsApi, users as usersApi, subscribers as subscribersApi } from './services/api';

// Components
import Notification from './components/ui/Notification';
import LoginModal from './components/modals/LoginModal';
import UserModal from './components/modals/UserModal';

// Views
import PublicView from './components/views/PublicView';
import ContributorView from './components/views/ContributorView';
import AdminView from './components/views/AdminView';

const App = () => {
  // State management functions
  const [domains, setDomains] = useState([]);
  const [news, setNews] = useState([]);
  const [users, setUsers] = useState([]);
  const [subscribers, setSubscribers] = useState([]);
  const [currentView, setCurrentView] = useState('public');
  const [currentUser, setCurrentUser] = useState(null);
  const [showLogin, setShowLogin] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [notification, setNotification] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Available colors for new domains
  const availableColors = [
    { name: 'Blue', value: '#3b82f6' },
    { name: 'Green', value: '#22c55e' },
    { name: 'Purple', value: '#a855f7' },
    { name: 'Orange', value: '#f97316' },
    { name: 'Red', value: '#ef4444' },
    { name: 'Pink', value: '#ec4899' },
    { name: 'Yellow', value: '#eab308' },
    { name: 'Indigo', value: '#6366f1' }
  ];

  // Dark mode effect
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setDarkMode(true);
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }, []);

  // Toggle dark mode
  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    if (newMode) {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('theme', 'light');
    }
  };

  // Show notification
  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // Data fetching
  const fetchPublicData = async () => {
    try {
      const [domainsData, newsData] = await Promise.all([
        domainsApi.getAll(),
        newsApi.getAll()
      ]);
      setDomains(domainsData);
      setNews(newsData);
    } catch (error) {
      console.error('Error fetching public data:', error);
      showNotification('Failed to load public data', 'error');
    }
  };

  const fetchAdminData = async () => {
    if (!currentUser || currentUser.role !== 'admin') return;
    try {
      const [usersData, subscribersData] = await Promise.all([
        usersApi.getAll(),
        subscribersApi.getAll()
      ]);
      setUsers(usersData);
      setSubscribers(subscribersData);
    } catch (error) {
      console.error('Error fetching admin data:', error);
      if (currentUser) {
        showNotification('Failed to load admin data', 'error');
      }
    }
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      await fetchPublicData();
      if (currentUser && currentUser.role === 'admin') {
        await fetchAdminData();
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setTimeout(() => setIsLoading(false), 500);
    }
  };

  // Auth Effects
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.exp * 1000 > Date.now()) {
          setCurrentUser({
            id: payload.userId,
            email: payload.email,
            username: payload.username,
            role: payload.role,
            domain: payload.domain
          });
        } else {
          localStorage.removeItem('accessToken');
        }
      } catch (error) {
        localStorage.removeItem('accessToken');
      }
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [currentUser]);

  // Auth Handlers
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const data = await auth.login(loginForm.email, loginForm.password);

      localStorage.setItem('accessToken', data.accessToken);
      setCurrentUser(data.user);
      setCurrentView(data.user.role === 'admin' ? 'admin' : 'contributor');
      setShowLogin(false);
      showNotification(`Welcome back, ${data.user.username}!`, 'success');
      setLoginForm({ email: '', password: '' });
    } catch (error) {
      showNotification(error.message, 'error');
    }
  };

  const handleLogout = async () => {
    await auth.logout();
    setCurrentUser(null);
    setCurrentView('public');
    setUsers([]);
    setSubscribers([]);
    showNotification('Logged out successfully', 'info');
  };

  // Domain Handlers
  const handleSaveDomain = async (domainData, isEditing) => {
    try {
      if (isEditing) {
        await domainsApi.update(domainData.id, domainData);
        showNotification('Domain updated successfully', 'success');
      } else {
        await domainsApi.create(domainData);
        showNotification('Domain added successfully', 'success');
      }
      fetchData();
      return true;
    } catch (error) {
      showNotification('Error saving domain', 'error');
      return false;
    }
  };

  const handleDeleteDomain = async (id) => {
    try {
      await domainsApi.delete(id);
      showNotification('Domain deleted successfully', 'success');
      fetchData();
    } catch (error) {
      showNotification('Error deleting domain', 'error');
    }
  };

  // User Handlers
  const handleSaveUser = async (userData, isEditing) => {
    try {
      if (isEditing) {
        await usersApi.update(userData.id, userData);
        showNotification('User updated successfully', 'success');
      } else {
        await usersApi.create(userData);
        showNotification('User added successfully', 'success');
      }
      fetchData();
      return true;
    } catch (error) {
      showNotification('Error saving user', 'error');
      return false;
    }
  };

  const handleDeleteUser = async (id) => {
    try {
      await usersApi.delete(id);
      showNotification('User deleted successfully', 'success');
      setUsers(users.filter(u => u.id !== id));
    } catch (error) {
      showNotification('Error deleting user', 'error');
    }
  };

  // News Handlers
  const handleSaveNews = async (newsData, isEditing) => {
    try {
      const payload = {
        ...newsData,
        author: currentUser.username,
        // If contributor, force their domain. If admin, trust the newsData.domain or fallback
        domain: currentUser.role === 'contributor' ? currentUser.domain : newsData.domain
      };

      if (isEditing) {
        await newsApi.update(newsData.id, payload);
        showNotification('News updated successfully', 'success');
      } else {
        await newsApi.create(payload);
        showNotification('News added successfully', 'success');
      }
      fetchData();
      return true;
    } catch (error) {
      showNotification('Error saving news', 'error');
      return false;
    }
  };

  const handleDeleteNews = async (id) => {
    try {
      await newsApi.delete(id);
      showNotification('News deleted successfully', 'success');
      setNews(news.filter(n => n.id !== id));
    } catch (error) {
      showNotification('Error deleting news', 'error');
    }
  };

  // Profile Handlers
  const handleOpenProfile = () => {
    setProfileData({ ...currentUser, password: '' });
    setShowProfile(true);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      const updatedUser = await usersApi.update(currentUser.id, profileData);
      setCurrentUser({ ...currentUser, username: updatedUser.username, email: updatedUser.email }); // Update local state, password is not returned
      showNotification('Profile updated successfully', 'success');
      setShowProfile(false);
    } catch (error) {
      showNotification('Error updating profile', 'error');
    }
  };

  return (
    <div className="app-container">
      {/* Header */}
      <header className="header">
        <div className="header-container">
          <div className="header-brand">
            <div className="header-logo" style={{ overflow: 'hidden', padding: 0 }}>
              <img src="/alenia_logo.png" alt="Alenia Pulse" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div>
              <h1 className="header-title">Alenia Pulse</h1>
              <p className="header-subtitle">Consulting & Connection</p>
            </div>
          </div>

          <div className="header-actions">
            <button onClick={toggleDarkMode} className="theme-toggle" aria-label="Toggle dark mode">
              <div className="theme-toggle-slider">
                {darkMode ? <Moon className="theme-toggle-icon" /> : <Sun className="theme-toggle-icon" />}
              </div>
            </button>

            {currentUser && (
              <div className="view-switcher">
                <button
                  onClick={() => setCurrentView('public')}
                  className={`view-switcher-btn ${currentView === 'public' ? 'active' : ''}`}
                >
                  <Newspaper size={16} />
                  <span>Public</span>
                </button>
                <button
                  onClick={() => setCurrentView('contributor')}
                  className={`view-switcher-btn ${currentView === 'contributor' ? 'active' : ''}`}
                >
                  <Mail size={16} />
                  <span>Contributor</span>
                </button>
                {currentUser.role === 'admin' && (
                  <button
                    onClick={() => setCurrentView('admin')}
                    className={`view-switcher-btn ${currentView === 'admin' ? 'active' : ''}`}
                  >
                    <User size={16} />
                    <span>Admin</span>
                  </button>
                )}
              </div>
            )}

            {currentUser ? (
              <div className="flex items-center gap-3">
                <button
                  onClick={handleOpenProfile}
                  className="btn btn-ghost btn-sm"
                  style={{ padding: '0px', marginRight: '8px' }}
                >
                  <div className="avatar avatar-sm">
                    {currentUser.username.charAt(0).toUpperCase()}
                  </div>
                </button>
                <button onClick={handleLogout} className="btn btn-ghost btn-sm">
                  <LogOut size={16} />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <button onClick={() => setShowLogin(true)} className="btn btn-primary">
                <User size={16} />
                Login
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content">
        {currentView === 'public' && (
          <PublicView
            news={news}
            domains={domains}
            isLoading={isLoading}
          />
        )}

        {currentView === 'contributor' && currentUser && (
          <ContributorView
            news={news}
            domains={domains}
            currentUser={currentUser}
            onSaveNews={handleSaveNews}
            onDeleteNews={handleDeleteNews}
          />
        )}

        {currentView === 'admin' && currentUser && (
          <AdminView
            domains={domains}
            users={users}
            news={news}
            currentUser={currentUser}
            onSaveDomain={handleSaveDomain}
            onDeleteDomain={handleDeleteDomain}
            onSaveUser={handleSaveUser}
            onDeleteUser={handleDeleteUser}
            onSaveNews={handleSaveNews}
            onDeleteNews={handleDeleteNews}
            availableColors={availableColors}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-container">
          <div className="footer-section">
            <h4>About</h4>
            <p>Company Newsletter - Your source for internal news and updates across all departments.</p>
          </div>
          <div className="footer-section">
            <h4>Quick Links</h4>
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
            <a href="#">Contact Us</a>
          </div>
          <div className="footer-section">
            <h4>Connect</h4>
            <p>Stay connected with your team and never miss an update.</p>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} Company Newsletter. All rights reserved.</p>
        </div>
      </footer>

      {/* Login Modal */}
      <LoginModal
        show={showLogin}
        onClose={() => setShowLogin(false)}
        onLogin={handleLogin}
        loginForm={loginForm}
        setLoginForm={setLoginForm}
      />

      {/* Profile Modal */}
      {currentUser && (
        <UserModal
          show={showProfile}
          onClose={() => setShowProfile(false)}
          onSave={handleSaveProfile}
          userData={profileData}
          setUserData={setProfileData}
          isEditing={true}
          isProfile={true}
          domains={domains}
        />
      )}

      {/* Notification Toast */}
      <Notification notification={notification} />
    </div>
  );
};

export default App;