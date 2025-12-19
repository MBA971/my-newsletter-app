import React, { useState, useEffect } from 'react';
import { Search, User, LogOut, Plus, Trash2, Calendar, Sun, Moon, Mail, Newspaper, Edit, X } from 'lucide-react';
import './App.css';

// Import services
import * as newsService from './services/news.service.js';
import * as domainsService from './services/domains.service.js';
import * as usersService from './services/users.service.js';
import * as authService from './services/auth.service.js';

// Import components
import { PublicView, ContributorView, AdminView, LoginForm, NewsModal, UserModal, DomainModal, Notification } from './components';

// Import hooks
import { useDataFetching } from './hooks/useDataFetching.js';

const App = () => {
  // State management
  const [domains, setDomains] = useState([]);
  const [news, setNews] = useState([]);
  const [users, setUsers] = useState([]);
  const [subscribers, setSubscribers] = useState([]);
  const [contributorNews, setContributorNews] = useState([]);
  const [adminNews, setAdminNews] = useState([]);
  const [currentView, setCurrentView] = useState('public');
  const [currentUser, setCurrentUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showLogin, setShowLogin] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [notification, setNotification] = useState(null);
  const [showAddNews, setShowAddNews] = useState(false);
  const [newNews, setNewNews] = useState({ title: '', content: '', domain: '' });
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState({ username: '', email: '', password: '', role: 'contributor', domain: '' });
  const [filterDomain, setFilterDomain] = useState('all');
  const [showAddDomain, setShowAddDomain] = useState(false);
  const [newDomain, setNewDomain] = useState({ name: '', color: '#3b82f6' });
  const [darkMode, setDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [editingUser, setEditingUser] = useState(null);
  const [editingDomain, setEditingDomain] = useState(null);
  const [editingNews, setEditingNews] = useState(null);

  // Domain colors mapping
  const domainColors = {
    'Hiring': '#3b82f6',        // Blue
    'Event': '#8b5cf6',         // Purple
    'Journey': '#22c55e',       // Green
    'Communication': '#f97316', // Orange
    'Admin': '#ef4444'          // Red
  };

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

  // Fetch public data from the backend
  const fetchPublicData = async () => {
    try {
      // Get domains and news in parallel
      const [domainsData, newsData] = await Promise.all([
        domainsService.fetchDomains(),
        newsService.fetchPublicNews()
      ]);
      
      setDomains(domainsData);
      setNews(newsData);
    } catch (error) {
      console.error('Error fetching public data:', error);
      showNotification('Failed to load public data', 'error');
    }
  };

  // Fetch contributor data from the backend
  const fetchContributorData = async () => {
    try {
      if (!authService.getCurrentUser()) {
        return;
      }
      
      const jsonData = await newsService.fetchContributorNews();
      setContributorNews(jsonData);
    } catch (error) {
      console.error('Error fetching contributor data:', error);
      showNotification('Failed to load contributor data: ' + error.message, 'error');
    }
  };

  // Test function to manually fetch contributor data
  const testFetchContributorData = async () => {
    await fetchContributorData();
  };

  // Fetch data from backend
  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Always fetch public data
      await fetchPublicData();
      // Fetch contributor data if user is logged in
      if (currentUser) {
        await fetchContributorData();
      }
      // Fetch admin data only if user is logged in as admin
      if (currentUser && (currentUser.role === 'super_admin' || currentUser.role === 'domain_admin')) {
        await fetchAdminData();
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      showNotification('Failed to load data', 'error');
    } finally {
      setTimeout(() => setIsLoading(false), 500);
    }
  };

  // Fetch admin data from the backend
  const fetchAdminData = async () => {
    try {
      // For domain admins, fetch users by domain
      // For super admins, fetch all users
      let usersData;
      if (currentUser && currentUser.role === 'domain_admin') {
        usersData = await usersService.fetchUsersByDomain();
        console.log('[DEBUG] Domain admin users data:', JSON.stringify(usersData, null, 2));
      } else {
        usersData = await usersService.fetchUsers();
        console.log('[DEBUG] Super admin users data:', JSON.stringify(usersData, null, 2));
      }
      
      const subscribersData = await usersService.fetchSubscribers();
      console.log('[DEBUG] Subscribers data:', JSON.stringify(subscribersData, null, 2));
      
      // Fetch all news for admin users
      const adminNewsData = await newsService.fetchAllNewsForAdmin();
      console.log('[DEBUG] Admin news data:', JSON.stringify(adminNewsData, null, 2));
      
      console.log('[DEBUG] Setting users data:', JSON.stringify(usersData, null, 2));
      setUsers(usersData);
      setSubscribers(subscribersData);
      setAdminNews(adminNewsData);
    } catch (error) {
      console.error('Error fetching admin data:', error);
      showNotification('Failed to load admin data', 'error');
    }
  };

  useEffect(() => {
    // Initialize currentUser from localStorage on app load
    const user = authService.getCurrentUser();
    if (user) {
      setCurrentUser(user);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [currentUser]);

  // Show notification
  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // Handle login
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const data = await authService.login(loginForm);
      const user = data.user;
      const token = data.accessToken;
      
      // Store token in localStorage
      localStorage.setItem('accessToken', token);
      setCurrentUser(user);
      setCurrentView(user.role === 'super_admin' || user.role === 'domain_admin' ? 'admin' : 'contributor');
      setShowLogin(false);
      showNotification(`Welcome back, ${user.username}!`, 'success');
      setLoginForm({ email: '', password: '' });
      
      // Fetch admin data if user is admin
      if (user.role === 'super_admin' || user.role === 'domain_admin') {
        await fetchAdminData();
      }
    } catch (error) {
      console.error('Login error:', error);
      showNotification('Login failed', 'error');
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await authService.logout();
      setCurrentUser(null);
      setCurrentView('public');
      setFilterDomain('all');
      showNotification('Logged out successfully', 'info');
    } catch (error) {
      console.error('Logout error:', error);
    }
    // Clear admin data
    setUsers([]);
    setSubscribers([]);
  };

  // Handle create news
  const handleCreateNews = async (e) => {
    e.preventDefault();
    try {
      const createdNews = await newsService.createNews(newNews);
      
      // Refresh contributor data to show the new article
      await fetchContributorData();
      
      setShowAddNews(false);
      setNewNews({ title: '', content: '', domain: '' });
      showNotification('Article created successfully!', 'success');
    } catch (error) {
      console.error('Error creating news:', error);
      showNotification('Failed to create article', 'error');
    }
  };

  // Handle update news
  const handleUpdateNews = async (e) => {
    e.preventDefault();
    try {
      const updatedNews = await newsService.updateNews(editingNews.id, newNews);
      
      // Refresh contributor data to show the updated article
      await fetchContributorData();
      
      setShowAddNews(false);
      setEditingNews(null);
      setNewNews({ title: '', content: '', domain: '' });
      showNotification('Article updated successfully!', 'success');
    } catch (error) {
      console.error('Error updating news:', error);
      showNotification('Failed to update article', 'error');
    }
  };

  // Handle delete/archive news
  const handleDeleteNews = async (id) => {
    try {
      const result = await newsService.deleteNews(id);
      
      // Refresh contributor data to reflect the deletion
      await fetchContributorData();
      
      showNotification('Article deleted successfully!', 'success');
    } catch (error) {
      console.error('Error deleting news:', error);
      showNotification('Failed to delete article', 'error');
    }
  };

  // Handle validate news (admin only)
  const handleValidateNews = async (id) => {
    try {
      const result = await newsService.validateNews(id);
      
      // Refresh data to reflect the validation
      await fetchData();
      
      showNotification('Article validated successfully!', 'success');
    } catch (error) {
      console.error('Error validating news:', error);
      showNotification('Failed to validate article', 'error');
    }
  };

  // Handle toggle archive news (admin only)
  const handleToggleArchiveNews = async (id) => {
    try {
      const result = await newsService.toggleArchiveNews(id);
      
      // Refresh data to reflect the archive status change
      await fetchData();
      
      showNotification(result.message, 'success');
    } catch (error) {
      console.error('Error toggling archive status:', error);
      showNotification('Failed to toggle archive status', 'error');
    }
  };

  // Handle like news (public)
  const handleLikeNews = async (id) => {
    try {
      const result = await newsService.likeNews(id);
      
      // Refresh public data to reflect the like count change
      await fetchPublicData();
      
      showNotification(`Article ${result.action === 'liked' ? 'liked' : 'unliked'}!`, 'success');
    } catch (error) {
      console.error('Error liking news:', error);
      showNotification('Failed to like article', 'error');
    }
  };

  // Handle create user (admin only)
  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      const createdUser = await usersService.createUser(newUser);
      
      // Refresh admin data to show the new user
      await fetchAdminData();
      
      setShowAddUser(false);
      setEditingUser(null);
      setNewUser({ username: '', email: '', password: '', role: 'contributor', domain: '' });
      showNotification('User created successfully!', 'success');
    } catch (error) {
      console.error('Error creating user:', error);
      showNotification('Failed to create user', 'error');
    }
  };

  // Handle update user (admin only)
  const handleUpdateUser = async (e) => {
    e.preventDefault();
    try {
      const updatedUser = await usersService.updateUser(editingUser.id, newUser);
      
      // Refresh admin data to show the updated user
      await fetchAdminData();
      
      setShowAddUser(false);
      setEditingUser(null);
      setNewUser({ username: '', email: '', password: '', role: 'contributor', domain: '' });
      showNotification('User updated successfully!', 'success');
    } catch (error) {
      console.error('Error updating user:', error);
      showNotification('Failed to update user', 'error');
    }
  };

  // Handle delete user (admin only)
  const handleDeleteUser = async (id) => {
    try {
      const result = await usersService.deleteUser(id);
      
      // Refresh admin data to reflect the deletion
      await fetchAdminData();
      
      showNotification('User deleted successfully!', 'success');
    } catch (error) {
      console.error('Error deleting user:', error);
      showNotification('Failed to delete user', 'error');
    }
  };

  // Handle create domain (admin only)
  const handleCreateDomain = async (e) => {
    e.preventDefault();
    try {
      const createdDomain = await domainsService.createDomain(newDomain);
      
      // Refresh public data to show the new domain
      await fetchPublicData();
      
      setShowAddDomain(false);
      setEditingDomain(null);
      setNewDomain({ name: '', color: '#3b82f6' });
      showNotification('Domain created successfully!', 'success');
    } catch (error) {
      console.error('Error creating domain:', error);
      showNotification('Failed to create domain', 'error');
    }
  };

  // Handle update domain (admin only)
  const handleUpdateDomain = async (e) => {
    e.preventDefault();
    try {
      const updatedDomain = await domainsService.updateDomain(editingDomain.id, newDomain);
      
      // Refresh public data to show the updated domain
      await fetchPublicData();
      
      setShowAddDomain(false);
      setEditingDomain(null);
      setNewDomain({ name: '', color: '#3b82f6' });
      showNotification('Domain updated successfully!', 'success');
    } catch (error) {
      console.error('Error updating domain:', error);
      showNotification('Failed to update domain', 'error');
    }
  };

  // Handle delete domain (admin only)
  const handleDeleteDomain = async (id) => {
    try {
      const result = await domainsService.deleteDomain(id);
      
      // Refresh public data to reflect the deletion
      await fetchPublicData();
      
      showNotification('Domain deleted successfully!', 'success');
    } catch (error) {
      console.error('Error deleting domain:', error);
      showNotification('Failed to delete domain', 'error');
    }
  };

  // Handle opening new user form
  const handleOpenNewUser = () => {
    setEditingUser(null);
    setNewUser({ username: '', email: '', password: '', role: 'contributor', domain: '' });
    setShowAddUser(true);
  };

  // Handle edit user
  const handleEditUser = (user) => {
    setEditingUser(user);
    setNewUser({
      username: user.username,
      email: user.email,
      password: '',
      role: user.role,
      domain: user.domain || ''
    });
    setShowAddUser(true);
  };

  // Handle opening new domain form
  const handleOpenNewDomain = () => {
    setEditingDomain(null);
    setNewDomain({ name: '', color: '#3b82f6' });
    setShowAddDomain(true);
  };

  // Handle edit domain
  const handleEditDomain = (domain) => {
    setEditingDomain(domain);
    setNewDomain({
      name: domain.name,
      color: domain.color
    });
    setShowAddDomain(true);
  };

  // Handle opening new news form
  const handleOpenNewNews = () => {
    setEditingNews(null);
    setNewNews({ title: '', content: '', domain: '' });
    setShowAddNews(true);
  };

  // Handle edit news
  const handleEditNews = (newsItem) => {
    setEditingNews(newsItem);
    setNewNews({
      title: newsItem.title,
      content: newsItem.content,
      domain: newsItem.domain
    });
    setShowAddNews(true);
  };

  // Handle cancel news form
  const handleCancelNews = () => {
    setEditingNews(null);
    setNewNews({ title: '', content: '', domain: '' });
    setShowAddNews(false);
  };

  // Handle cancel user form
  const handleCancelUser = () => {
    setEditingUser(null);
    setNewUser({ username: '', email: '', password: '', role: 'contributor', domain: '' });
    setShowAddUser(false);
  };

  // Handle cancel domain form
  const handleCancelDomain = () => {
    setEditingDomain(null);
    setNewDomain({ name: '', color: '#3b82f6' });
    setShowAddDomain(false);
  };

  return (
    <div className={`app ${darkMode ? 'dark-mode' : ''}`}>
      {/* Header */}
      <header className="app-header">
        <div className="header-content">
          <div className="app-title-container">
            <h1 className="app-title">Newsletter App</h1>
            <span className="app-version">v1.2.2</span>
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

      {/* Notification */}
      <Notification notification={notification} />

      {/* Loading indicator */}
      {isLoading && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
        </div>
      )}

      {/* Main Content */}
      <main className="main-content">
        {currentView === 'public' && (
          <PublicView 
            news={news}
            domains={domains}
            domainColors={domainColors}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            filterDomain={filterDomain}
            setFilterDomain={setFilterDomain}
            handleLikeNews={handleLikeNews}
          />
        )}
        {currentView === 'contributor' && (
          <ContributorView 
            contributorNews={contributorNews}
            domainColors={domainColors}
            handleOpenNewNews={handleOpenNewNews}
            handleEditNews={handleEditNews}
            handleDeleteNews={handleDeleteNews}
            testFetchContributorData={testFetchContributorData}
          />
        )}
        {currentView === 'admin' && (
          <AdminView 
            users={users}
            subscribers={subscribers}
            domains={domains}
            domainColors={domainColors}
            news={adminNews}
            archivedNews={archivedNews}
            auditLogs={auditLogs}
            pendingValidationNews={pendingValidationNews}
            onSaveDomain={handleUpdateDomain}
            onDeleteDomain={handleDeleteDomain}
            onSaveUser={handleUpdateUser}
            onDeleteUser={handleDeleteUser}
            onSaveNews={handleUpdateNews}
            onDeleteNews={handleDeleteNews}
            onValidateNews={handleValidateNews}
            onToggleArchive={handleToggleArchiveNews}
            availableColors={availableColors}
            currentUser={currentUser}
          />
        )}
      </main>

      {/* Modals */}
      {showLogin && (
        <LoginForm 
          loginForm={loginForm}
          setLoginForm={setLoginForm}
          handleLogin={handleLogin}
          setShowLogin={setShowLogin}
        />
      )}
      
      {showAddNews && (
        <NewsModal
          editingNews={editingNews}
          newNews={newNews}
          setNewNews={setNewNews}
          domains={domains}
          currentUser={currentUser}
          handleCreateNews={handleCreateNews}
          handleUpdateNews={handleUpdateNews}
          handleCancelNews={handleCancelNews}
        />
      )}
      
      {showAddUser && (
        <UserModal
          editingUser={editingUser}
          newUser={newUser}
          setNewUser={setNewUser}
          domains={domains}
          handleCreateUser={handleCreateUser}
          handleUpdateUser={handleUpdateUser}
          handleCancelUser={handleCancelUser}
        />
      )}
      
      {showAddDomain && (
        <DomainModal
          editingDomain={editingDomain}
          newDomain={newDomain}
          setNewDomain={setNewDomain}
          availableColors={availableColors}
          handleCreateDomain={handleCreateDomain}
          handleUpdateDomain={handleUpdateDomain}
          handleCancelDomain={handleCancelDomain}
        />
      )}
    </div>
  );
};

export default App;