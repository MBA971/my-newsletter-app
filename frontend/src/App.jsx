import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { User, LogOut, Sun, Moon, Newspaper, Mail } from 'lucide-react';
import './App.css';
import './themes/modernThemes.css';

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
  const [publicNews, setPublicNews] = useState([]); // Separate state for public news
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
    domains.reduce((acc, domain) => {
      if (domain && domain.name && domain.color) {
        acc[domain.name] = domain.color;
      }
      return acc;
    }, {}),
    [domains]);

  // Theme Management
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setDarkMode(true);
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      // Apply default theme (macOS style)
      document.body.className = 'theme-macos';
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
      // Filter out any invalid domains
      const validDomains = domainsData.filter(domain => domain && domain.id && domain.name);
      setDomains(validDomains);
      setPublicNews(newsData);
    } catch (error) {
      console.error('Error fetching public data:', error);
      showNotification('Failed to load public data', 'error');
    }
  }, [showNotification]);

  const fetchAdminData = useCallback(async () => {
    if (!currentUser || (currentUser.role !== 'super_admin' && currentUser.role !== 'domain_admin')) return;
    try {
      console.log('[DEBUG] Fetching admin data for user:', currentUser);

      // Fetch users based on role
      const usersData = currentUser.role === 'super_admin'
        ? await usersApi.getAll()
        : await usersApi.getByDomain();

      // Fetch news based on role
      // Fetch news based on role
      // Use getAllAdmin for both super_admin and domain_admin
      // The backend controller automatically handles domain filtering for domain_admin
      console.log('[DEBUG] App: Fetching admin news data for:', currentUser.role);
      const newsData = await newsApi.getAllAdmin();

      console.log('[DEBUG] App: Received admin news data:', newsData);
      console.log('[DEBUG] Users data received:', usersData);
      console.log('[DEBUG] News data received:', newsData);

      // Filter out any invalid data
      const validUsers = usersData.filter(user => user && user.id);
      const validNews = newsData.filter(newsItem => newsItem && newsItem.id);

      setUsers(validUsers);
      setNews(validNews);

      // Fetch audit logs for super admins only
      if (currentUser.role === 'super_admin') {
        const auditData = await auditApi.getAll();
        setAuditLogs(auditData);
      }
    } catch (error) {
      console.error('Error fetching admin data:', error);
      // Only show error for super admins, domain admins might have limited access by design
      if (currentUser.role === 'super_admin') {
        showNotification('Failed to load admin data: ' + error.message, 'error');
      }
    }
  }, [currentUser, showNotification]);
  const fetchContributorData = useCallback(async () => {
    if (!currentUser || currentUser.role !== 'contributor') return;
    try {
      const contributorNewsData = await newsApi.getContributorNews();
      // Filter out any invalid news items
      const validNews = contributorNewsData.filter(newsItem => newsItem && newsItem.id);
      setNews(validNews);
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
            domain_id: payload.domain_id,
            domain: payload.domain_name
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
  const handleLogin = async (loginData) => {
    // If no loginData was provided (shouldn't happen but just in case)
    if (!loginData || !loginData.email || !loginData.password) {
      showNotification('Please provide both email and password', 'error');
      return;
    }

    try {
      const data = await auth.login(loginData.email, loginData.password);
      localStorage.setItem('accessToken', data.accessToken);
      const user = { ...data.user };
      setCurrentUser(user);
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
  const handleSaveNews = async (e, newsData) => {
    try {
      console.log('[DEBUG] handleSaveNews called with:', { newsData, isEditing, currentUser, domains });
      console.log('[DEBUG] Available domains:', domains.map(d => ({ id: d.id, name: d.name })));
      let domainValue = newsData.domain_id || newsData.domain;  // Use domain_id or domain fallback

      if (currentUser.role === 'contributor') {
        // For contributors, use their assigned domain
        const userDomainId = currentUser.domain_id;  // Use domain_id instead of domain
        console.log('[DEBUG] Contributor role - user domain ID:', userDomainId);

        // Check if contributor has a domain assigned
        if (!userDomainId) {
          console.error('[ERROR] Contributor user has no domain assigned');
          showNotification('You must be assigned to a domain before creating or editing articles. Please contact your administrator.', 'error');
          return false;
        }

        // Use the contributor's assigned domain
        domainValue = userDomainId;
        console.log('[DEBUG] Using contributor\'s domain ID:', domainValue);
      } else if (currentUser.role === 'domain_admin') {
        // For domain admins, they should only create/edit articles in their assigned domain
        const userDomainId = currentUser.domain_id;
        console.log('[DEBUG] Domain admin role - user domain ID:', userDomainId);

        // Check if domain admin has a domain assigned
        if (!userDomainId) {
          console.error('[ERROR] Domain admin user has no domain assigned');
          showNotification('You must be assigned to a domain before creating or editing articles. Please contact your administrator.', 'error');
          return false;
        }

        // Use the domain admin's assigned domain
        domainValue = userDomainId;
        console.log('[DEBUG] Using domain admin\'s domain ID:', domainValue);
      } else if (currentUser.role === 'super_admin' && !isEditing) {
        // For super admins creating new articles, ensure domain is selected
        if (!domainValue) {
          showNotification('Please select a domain for this article', 'error');
          return false;
        }
        console.log('[DEBUG] Super admin creating article with domain ID:', domainValue);
      }

      // Prepare data for API call
      const newsPayload = {
        title: newsData.title,
        content: newsData.content,
        domain_id: domainValue  // Use domain_id instead of domain
      };

      console.log('[DEBUG] Sending news payload:', newsPayload);

      if (isEditing) {
        await newsApi.update(newsData.id, newsPayload);
        showNotification('Article updated', 'success');
      } else {
        await newsApi.create(newsPayload);
        showNotification('Article created', 'success');
      }
      fetchData();
      return true;
    } catch (error) {
      console.error('[DEBUG] Error in handleSaveNews:', error);
      if (error.response) {
        console.error('[DEBUG] Error response:', error.response);
        showNotification(`Error saving article: ${error.response.data?.error || error.response.statusText || error.message}`, 'error');
      } else {
        showNotification(error.message || 'Error saving article', 'error');
      }
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

  const handleSaveProfile = async (userDataToSend) => {
    try {
      // Only send fields that have actually changed
      const originalUserData = {
        id: currentUser?.id,
        username: currentUser?.username,
        email: currentUser?.email,
        role: currentUser?.role,
        domain: currentUser?.domain,
        domain_id: currentUser?.domain_id
      };

      // If no userDataToSend was provided (shouldn't happen but just in case)
      if (!userDataToSend) {
        showNotification('No data to save', 'info');
        setShowProfile(false);
        return;
      }

      // Compare each field and only include changed ones
      const finalUserData = {};
      
      if (userDataToSend.username !== originalUserData.username) {
        finalUserData.username = userDataToSend.username;
      }

      if (userDataToSend.email !== originalUserData.email) {
        finalUserData.email = userDataToSend.email;
      }

      // Only include password if it's not empty (indicating user wants to change it)
      if (userDataToSend.password && userDataToSend.password.trim() !== '') {
        finalUserData.password = userDataToSend.password;
      }

      // For contributors, don't allow changing domain assignment through profile updates
      // Domain assignment should only be managed by admins
      if (currentUser.role === 'contributor') {
        // Don't include domain or domain_id for contributors in profile updates
        // Their domain is managed by administrators
      } else if (currentUser.role === 'domain_admin' || currentUser.role === 'super_admin') {
        // For domain admins and super admins, include domain_id if it changed
        if (userDataToSend.domain_id !== originalUserData.domain_id) {
          // Map domain to domain_id for backend
          finalUserData.domain_id = userDataToSend.domain_id;
        }
      }
      // Don't include domain_id for regular users as they typically don't have domain assignments

      // If no fields have changed, show a message and return
      if (Object.keys(finalUserData).length === 0) {
        showNotification('No changes to save', 'info');
        setShowProfile(false);
        return;
      }

      console.log('[DEBUG] Sending profile update with:', finalUserData);

      const updatedUser = await usersApi.update(currentUser.id, finalUserData);
      setCurrentUser(prev => ({
        ...prev,
        username: updatedUser.username,
        email: updatedUser.email
      }));
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
          <PublicView news={publicNews} domains={domains} isLoading={isLoading} />
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
            showNotification={showNotification}
            fetchData={fetchData}
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
            showNotification={showNotification}
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
          <p className="text-xs text-tertiary">Version 1.4.0</p>
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
