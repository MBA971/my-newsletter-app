import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { User, LogOut, Sun, Moon, Newspaper, Mail } from 'lucide-react';
import './App.css';

// Services
import { auth, domains as domainsApi, news as newsApi, users as usersApi, audit as auditApi } from './services/api';

// Components
import Notification from './components/ui/Notification';
import LoginModal from './components/modals/LoginModal';
import UserModal from './components/modals/UserModal';

// Views
import PublicView from './components/views/PublicView';
import ContributorView from './components/views/ContributorView';
import AdminView from './components/views/AdminView';

const App = () => {
  // State management
  const [domains, setDomains] = useState([]);
  const [news, setNews] = useState([]);
  const [users, setUsers] = useState([]);
  const [subscribers, setSubscribers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [currentView, setCurrentView] = useState('public');
  const [currentUser, setCurrentUser] = useState(null);
  const [showLogin, setShowLogin] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [notification, setNotification] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Constants
  const availableColors = useMemo(() => [
    { name: 'Blue', value: '#3b82f6' },
    { name: 'Green', value: '#22c55e' },
    { name: 'Purple', value: '#a855f7' },
    { name: 'Orange', value: '#f97316' },
    { name: 'Red', value: '#ef4444' },
    { name: 'Pink', value: '#ec4899' },
    { name: 'Yellow', value: '#eab308' },
    { name: 'Indigo', value: '#6366f1' }
  ], []);

  // Memoized domain colors map
  const domainColors = useMemo(() =>
    domains.reduce((acc, domain) => ({ ...acc, [domain.name]: domain.color }), {}),
    [domains]);

  // Theme Management
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setDarkMode(true);
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }, []);

  const toggleDarkMode = useCallback(() => {
    setDarkMode(prev => {
      const newMode = !prev;
      if (newMode) {
        document.documentElement.setAttribute('data-theme', 'dark');
        localStorage.setItem('theme', 'dark');
      } else {
        document.documentElement.removeAttribute('data-theme');
        localStorage.setItem('theme', 'light');
      }
      return newMode;
    });
  }, []);

  // Notifications
  const showNotification = useCallback((message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  }, []);

  // Data Actions
  const fetchPublicData = useCallback(async () => {
    try {
      const [domainsData, newsData] = await Promise.all([
        domainsApi.getAll(),
        newsApi.getAll()
      ]);
      console.log('[DEBUG] Domains data received:', domainsData);
      setDomains(domainsData);
      setNews(newsData);
    } catch (error) {
      console.error('Error fetching public data:', error);
      showNotification('Failed to load public data', 'error');
    }
  }, [showNotification]);

  const fetchAdminData = useCallback(async () => {
    if (!currentUser || (currentUser.role !== 'super_admin' && currentUser.role !== 'domain_admin')) return;
    try {
      console.log('[DEBUG] Fetching admin data for user:', currentUser);
      const [usersData, adminNewsData] = await Promise.all([
        currentUser.role === 'super_admin' ? usersApi.getAll() : usersApi.getByDomain(),
        newsApi.getAllAdmin()
      ]);

      console.log('[DEBUG] Users data received:', usersData);
      console.log('[DEBUG] Admin news data received:', adminNewsData);

      setUsers(usersData);
      setNews(adminNewsData);

      // Fetch audit logs for super admins
      if (currentUser.role === 'super_admin') {
        const auditData = await auditApi.getAll();
        setAuditLogs(auditData);
      }
    } catch (error) {
      console.error('Error fetching admin data:', error);
      showNotification('Failed to load admin data: ' + error.message, 'error');
    }
  }, [currentUser, showNotification]);

  const fetchContributorData = useCallback(async () => {
    if (!currentUser || currentUser.role !== 'contributor') return;
    try {
      const contributorNewsData = await newsApi.getContributorNews();
      setNews(contributorNewsData);
    } catch (error) {
      console.error('Error fetching contributor data:', error);
      showNotification('Failed to load contributor data: ' + error.message, 'error');
    }
  }, [currentUser, showNotification]);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      await fetchPublicData();
      if (currentUser && (currentUser.role === 'super_admin' || currentUser.role === 'domain_admin')) {
        await fetchAdminData();
      } else if (currentUser && currentUser.role === 'contributor') {
        await fetchContributorData();
      }
    } finally {
      setTimeout(() => setIsLoading(false), 300);
    }
  }, [currentUser, fetchPublicData, fetchAdminData, fetchContributorData]);

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
  }, [fetchData]);

  // Debug: Log users state changes
  useEffect(() => {
    console.log('[DEBUG] Users state updated:', users);
  }, [users]);

  // Auth Handlers
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const data = await auth.login(loginForm.email, loginForm.password);
      localStorage.setItem('accessToken', data.accessToken);
      setCurrentUser(data.user);
      setCurrentView(data.user.role === 'super_admin' || data.user.role === 'domain_admin' ? 'admin' : 'contributor');
      setShowLogin(false);
      showNotification(`Welcome back, ${data.user.username}!`, 'success');
      setLoginForm({ email: '', password: '' });
    } catch (error) {
      showNotification(error.message || 'Login failed', 'error');
    }
  };

  const handleLogout = useCallback(async () => {
    await auth.logout();
    setCurrentUser(null);
    setCurrentView('public');
    setUsers([]);
    setSubscribers([]);
    showNotification('Logged out successfully', 'info');
  }, [showNotification]);

  // Domain Handlers
  const handleSaveDomain = async (domainData, isEditing) => {
    try {
      if (isEditing) {
        await domainsApi.update(domainData.id, domainData);
        showNotification('Domain updated', 'success');
      } else {
        await domainsApi.create(domainData);
        showNotification('Domain added', 'success');
      }
      fetchData();
      return true;
    } catch (error) {
      showNotification(error.message || 'Error saving domain', 'error');
      return false;
    }
  };

  const handleDeleteDomain = async (id) => {
    try {
      await domainsApi.delete(id);
      showNotification('Domain deleted', 'success');
      fetchData();
    } catch (error) {
      showNotification(error.message || 'Error deleting domain', 'error');
    }
  };

  // User Handlers
  const handleSaveUser = async (userData, isEditing) => {
    try {
      console.log('[DEBUG] Saving user data:', userData);
      if (isEditing) {
        const response = await usersApi.update(userData.id, userData);
        console.log('[DEBUG] User update response:', response);
        showNotification('User updated', 'success');
      } else {
        await usersApi.create(userData);
        showNotification('User added', 'success');
      }
      fetchData();
      return true;
    } catch (error) {
      console.error('[DEBUG] Error saving user:', error);
      // Try to get more detailed error information
      if (error.response) {
        console.error('[DEBUG] Error response:', error.response);
        showNotification(`Error saving user: ${error.response.statusText || error.message}`, 'error');
      } else {
        showNotification(error.message || 'Error saving user', 'error');
      }
      return false;
    }
  };

  const handleDeleteUser = async (id) => {
    try {
      await usersApi.delete(id);
      showNotification('User deleted', 'success');
      setUsers(prev => prev.filter(u => u.id !== id));
    } catch (error) {
      showNotification(error.message || 'Error deleting user', 'error');
    }
  };

  // News Handlers
  const handleSaveNews = async (newsData, isEditing) => {
    try {
      console.log('[DEBUG] handleSaveNews called with:', { newsData, isEditing, currentUser, domains });
      console.log('[DEBUG] Available domains:', domains.map(d => ({ id: d.id, name: d.name })));
      let domainValue = newsData.domain;
      
      if (currentUser.role === 'contributor') {
        // For contributors, use their assigned domain
        const userDomain = currentUser.domain;
        console.log('[DEBUG] Contributor role - user domain:', userDomain);
        
        // Check if contributor has a domain assigned
        if (!userDomain) {
          console.error('[ERROR] Contributor user has no domain assigned');
          showNotification('You must be assigned to a domain before creating or editing articles. Please contact your administrator.', 'error');
          return false;
        }
        
        // Try to find domain by name (case-insensitive and trimmed)
        const domainObj = domains.find(d => 
          d.name && userDomain && 
          d.name.toString().trim().toLowerCase() === userDomain.toString().trim().toLowerCase()
        );
        domainValue = domainObj ? domainObj.id : null;
        console.log('[DEBUG] Contributor role - found domain object:', domainObj, 'resolved domainValue:', domainValue);
        
        // If still null, try to get domain from existing article as fallback
        if (domainValue === null && newsData.id) {
          const existingNews = news.find(n => n.id === newsData.id);
          if (existingNews) {
            // Try to get domain ID from existing news item
            domainValue = existingNews.domain_id || 
                         (existingNews.domain && typeof existingNews.domain === 'number' ? existingNews.domain : null);
            console.log('[DEBUG] Contributor role - using domain from existing article:', domainValue);
            
            // If we still don't have a domain ID, try to find it by domain name
            if (domainValue === null && existingNews.domain && typeof existingNews.domain === 'string') {
              const existingDomainObj = domains.find(d => 
                d.name && existingNews.domain && 
                d.name.toString().trim().toLowerCase() === existingNews.domain.toString().trim().toLowerCase()
              );
              domainValue = existingDomainObj ? existingDomainObj.id : null;
              console.log('[DEBUG] Contributor role - found domain by existing article name:', existingDomainObj, 'domainValue:', domainValue);
            }
          }
        }
      } else if (typeof newsData.domain === 'string') {
        // For admins, try to find domain by name
        const domainObj = domains.find(d => 
          d.name && newsData.domain && 
          d.name.toString().trim().toLowerCase() === newsData.domain.toString().trim().toLowerCase()
        );
        domainValue = domainObj ? domainObj.id : newsData.domain;
        console.log('[DEBUG] String domain - resolved domainValue:', domainValue);
      }

      // Validate that we have a domain
      if (domainValue === null || domainValue === undefined) {
        console.error('[ERROR] No valid domain found for news article');
        showNotification('Unable to determine article domain. Please contact administrator.', 'error');
        return false;
      }

      const payload = { ...newsData, author: currentUser.username, domain: domainValue };
      console.log('[DEBUG] Sending payload:', payload);

      if (isEditing) {
        await newsApi.update(newsData.id, payload);
        showNotification('News updated', 'success');
      } else {
        await newsApi.create(payload);
        showNotification('News added', 'success');
      }
      fetchData();
      return true;
    } catch (error) {
      console.error('[ERROR] handleSaveNews:', error);
      showNotification(error.message || 'Error saving news', 'error');
      return false;
    }
  };

  const handleDeleteNews = async (id) => {
    try {
      await newsApi.delete(id);
      showNotification('News deleted', 'success');
      setNews(prev => prev.filter(n => n.id !== id));
    } catch (error) {
      showNotification(error.message || 'Error deleting news', 'error');
    }
  };

  // Archive/Unarchive handlers for contributors
  const handleArchiveNews = async (id) => {
    try {
      await newsApi.archive(id);
      showNotification('News archived', 'success');
      fetchData(); // Refresh the data
    } catch (error) {
      showNotification(error.message || 'Error archiving news', 'error');
    }
  };

  const handleUnarchiveNews = async (id) => {
    try {
      await newsApi.unarchive(id);
      showNotification('News unarchived', 'success');
      fetchData(); // Refresh the data
    } catch (error) {
      showNotification(error.message || 'Error unarchiving news', 'error');
    }
  };

  // Profile Handlers
  const handleOpenProfile = () => {
    setProfileData({
      id: currentUser?.id || '',
      username: currentUser?.username || '',
      email: currentUser?.email || '',
      password: '',
      role: currentUser?.role || 'user',
      domain: currentUser?.domain || null
    });
    setShowProfile(true);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      const updatedUser = await usersApi.update(currentUser.id, profileData);
      setCurrentUser(prev => ({ ...prev, username: updatedUser.username, email: updatedUser.email }));
      showNotification('Profile updated', 'success');
      setShowProfile(false);
    } catch (error) {
      showNotification(error.message || 'Error updating profile', 'error');
    }
  };

  return (
    <div className="app-container">
      <header className="header">
        <div className="header-container">
          <div className="header-brand">
            <div className="header-logo" style={{ overflow: 'hidden', padding: 0 }}>
              <img src="/alenia_logo.png" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div>
              <h1 className="header-title">Alenia Pulse</h1>
            </div>
          </div>

          <div className="header-actions">
            <button onClick={toggleDarkMode} className="theme-toggle glass" aria-label="Toggle dark mode">
              <div className="theme-toggle-slider">
                {darkMode ? <Moon className="theme-toggle-icon" /> : <Sun className="theme-toggle-icon" />}
              </div>
            </button>

            {currentUser && (
              <div className="view-switcher glass">
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
                {(currentUser.role === 'super_admin' || currentUser.role === 'domain_admin') && (
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
                <button onClick={handleOpenProfile} className="avatar-btn glass">
                  <div className="avatar avatar-sm">
                    {currentUser.username.charAt(0).toUpperCase()}
                  </div>
                </button>
                <button onClick={handleLogout} className="btn btn-ghost btn-sm glass">
                  <LogOut size={16} />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <button onClick={() => setShowLogin(true)} className="btn btn-primary glass">
                <User size={16} />
                Login
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="main-content">
        {currentView === 'public' && (
          <PublicView news={news} domains={domains} isLoading={isLoading} />
        )}

        {currentView === 'contributor' && currentUser && (
          <ContributorView
            news={news}
            domains={domains}
            currentUser={currentUser}
            onSaveNews={handleSaveNews}
            onDeleteNews={handleDeleteNews}
            onArchiveNews={handleArchiveNews}
            onUnarchiveNews={handleUnarchiveNews}
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
            domainColors={domainColors}
            auditLogs={auditLogs}
          />
        )}
      </main>

      <footer className="footer glass">
        <div className="footer-container">
          <div className="footer-section">
            <h4>About Alenia Pulse</h4>
            <p>Empowering teams through seamless communication and shared knowledge.</p>
          </div>
          <div className="footer-section">
            <h4>Support</h4>
            <a href="#">Help Center</a>
            <a href="#">Safety & Security</a>
          </div>
          <div className="footer-section">
            <h4>Latest</h4>
            <p>Check out the latest updates in the public view.</p>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} Alenia Consulting. All rights reserved.</p>
        </div>
      </footer>

      <LoginModal
        show={showLogin}
        onClose={() => setShowLogin(false)}
        onLogin={handleLogin}
        loginForm={loginForm}
        setLoginForm={setLoginForm}
      />

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

      <Notification notification={notification} />
    </div>
  );
};

export default App;
