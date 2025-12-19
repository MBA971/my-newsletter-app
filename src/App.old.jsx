import React, { useState, useEffect } from 'react';
import { Search, User, LogOut, Plus, Trash2, Calendar, Sun, Moon, Mail, Newspaper, Edit } from 'lucide-react';
import './App.css';

// Import services
import * as newsService from './services/news.service.js';
import * as domainsService from './services/domains.service.js';
import * as usersService from './services/users.service.js';
import * as authService from './services/auth.service.js';

// Import hooks
import { useDataFetching } from './hooks/useDataFetching.js';

// TEST LOG - This should always appear
console.log('APP.JSX FILE LOADED');

const App = () => {
  console.log('App component mounted');
  // State management
  const [domains, setDomains] = useState([]);
  const [news, setNews] = useState([]);
  const [users, setUsers] = useState([]);
  const [subscribers, setSubscribers] = useState([]);
  const [contributorNews, setContributorNews] = useState([]);
  console.log('Initial contributorNews state:', contributorNews);
  const setContributorNewsWithLogging = (data) => {
    console.log('Setting contributorNews with data:', data);
    setContributorNews(data);
  };
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
      console.log('Fetching public data from service');
      
      // Get domains and news in parallel
      const [domainsData, newsData] = await Promise.all([
        domainsService.fetchDomains(),
        newsService.fetchPublicNews()
      ]);
      
      console.log('Domains data received:', domainsData.length, 'items');
      console.log('News data received:', newsData.length, 'items');
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
      console.log('Fetching contributor data from service');
      
      if (!authService.getCurrentUser()) {
        console.log('No user found, skipping contributor data fetch');
        return;
      }
      
      const jsonData = await newsService.fetchContributorNews();
      console.log('Contributor news data received:', jsonData);
      setContributorNewsWithLogging(jsonData);
      console.log('Contributor news state updated with', jsonData.length, 'articles');
    } catch (error) {
      console.error('Error fetching contributor data:', error);
      showNotification('Failed to load contributor data: ' + error.message, 'error');
    }
  };

  // Test function to manually fetch contributor data
  const testFetchContributorData = async () => {
    console.log('Manually triggering contributor data fetch...');
    await fetchContributorData();
  };

  // Fetch data from backend
  const fetchData = async () => {
    setIsLoading(true);
    console.log('fetchData called, currentUser:', currentUser);
    try {
      // Always fetch public data
      console.log('Fetching public data');
      await fetchPublicData();
      // Fetch contributor data if user is logged in
      if (currentUser) {
        console.log('Fetching contributor data for user:', currentUser);
        await fetchContributorData();
      }
      // Fetch admin data only if user is logged in as admin
      if (currentUser && (currentUser.role === 'super_admin' || currentUser.role === 'domain_admin')) {
        console.log('Fetching admin data for user:', currentUser);
        await fetchAdminData();
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      showNotification('Failed to load data', 'error');
    } finally {
      console.log('Finished fetching data');
      setTimeout(() => setIsLoading(false), 500);
    }
  };

  // Fetch admin data from the backend
  const fetchAdminData = async () => {
    try {
      console.log('Fetching admin data from services');
      
      // For domain admins, fetch users by domain
      // For super admins, fetch all users
      let usersData;
      if (currentUser && currentUser.role === 'domain_admin') {
        usersData = await usersService.fetchUsersByDomain();
      } else {
        usersData = await usersService.fetchUsers();
      }
      
      const subscribersData = await usersService.fetchSubscribers();
      
      setUsers(usersData);
      setSubscribers(subscribersData);
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
    console.log('useEffect triggered, currentUser changed:', currentUser);
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
      console.log('Logging in with credentials:', loginForm);
      const data = await authService.login(loginForm);
      const user = data.user;
      const token = data.accessToken;
      
      // Store token in localStorage
      localStorage.setItem('accessToken', token);
      console.log('Login successful, user:', user);
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
      console.log('Logging out user');
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

  // Filter news
  const getFilteredNews = () => {
    const filteredNews = news.filter(item =>
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.author.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const domainFilteredNews = filterDomain === 'all'
      ? filteredNews
      : filteredNews.filter(n => n.domain === filterDomain);

    const contributorNews = currentUser && currentUser.role === 'contributor'
      ? news.filter(item => 
          item.domain === currentUser.domain || 
          (item.author && currentUser.username && 
           item.author.toString().trim() === currentUser.username.toString().trim()))
        : [];

    return { filteredNews, domainFilteredNews, contributorNews };
  };

  // Handle create news
  const handleCreateNews = async (e) => {
    e.preventDefault();
    try {
      console.log('Creating news:', newNews);
      const createdNews = await newsService.createNews(newNews);
      console.log('News created:', createdNews);
      
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
      console.log('Updating news:', editingNews.id, newNews);
      const updatedNews = await newsService.updateNews(editingNews.id, newNews);
      console.log('News updated:', updatedNews);
      
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
      console.log('Deleting/archiving news:', id);
      const result = await newsService.deleteNews(id);
      console.log('News deleted/archived:', result);
      
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
      console.log('Validating news:', id);
      const result = await newsService.validateNews(id);
      console.log('News validated:', result);
      
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
      console.log('Toggling archive status for news:', id);
      const result = await newsService.toggleArchiveNews(id);
      console.log('News archive status toggled:', result);
      
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
      console.log('Liking news:', id);
      const result = await newsService.likeNews(id);
      console.log('News liked:', result);
      
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
      console.log('Creating user:', newUser);
      const createdUser = await usersService.createUser(newUser);
      console.log('User created:', createdUser);
      
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
      console.log('Updating user:', editingUser.id, newUser);
      const updatedUser = await usersService.updateUser(editingUser.id, newUser);
      console.log('User updated:', updatedUser);
      
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
      console.log('Deleting user:', id);
      const result = await usersService.deleteUser(id);
      console.log('User deleted:', result);
      
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
      console.log('Creating domain:', newDomain);
      const createdDomain = await domainsService.createDomain(newDomain);
      console.log('Domain created:', createdDomain);
      
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
      console.log('Updating domain:', editingDomain.id, newDomain);
      const updatedDomain = await domainsService.updateDomain(editingDomain.id, newDomain);
      console.log('Domain updated:', updatedDomain);
      
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
      console.log('Deleting domain:', id);
      const result = await domainsService.deleteDomain(id);
      console.log('Domain deleted:', result);
      
      // Refresh public data to reflect the deletion
      await fetchPublicData();
      
      showNotification('Domain deleted successfully!', 'success');
    } catch (error) {
      console.error('Error deleting domain:', error);
      showNotification('Failed to delete domain', 'error');
    }
  };

  // Calculate reading time
  const calculateReadingTime = (content) => {
    const wordsPerMinute = 200;
    const words = content.split(' ').length;
    const minutes = Math.ceil(words / wordsPerMinute);
    return minutes;
  };

  // Check if article is new (within last 7 days)
  const isNewArticle = (date) => {
    const articleDate = new Date(date);
    const now = new Date();
    const diffTime = Math.abs(now - articleDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7;
  };

  // Get domain color
  const getDomainColor = (domainName) => {
    const domain = domains.find(d => d.name === domainName);
    return domain?.color || domainColors[domainName] || '#3b82f6';
  };

  // Skeleton Loading Component
  const SkeletonCard = () => (
    <div className="card">
      <div className="skeleton skeleton-title"></div>
      <div className="skeleton skeleton-text"></div>
      <div className="skeleton skeleton-text" style={{ width: '80%' }}></div>
      <div className="skeleton skeleton-text" style={{ width: '60%' }}></div>
    </div>
  );

  // Public View Component
  const PublicView = () => (
    <div className="animate-fadeIn">
      {/* Search Bar */}
      <div className="search-container" style={{ marginBottom: 'var(--spacing-8)' }}>
        <Search className="search-icon" size={20} />
        <input
          type="text"
          placeholder="Search articles by title, content, or author..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      {/* Domain Filters */}
      <div className="filter-chips">
        <button
          onClick={() => setFilterDomain('all')}
          className={`filter-chip ${filterDomain === 'all' ? 'active' : ''}`}
        >
          All News
        </button>
        {domains.map(domain => (
          <button
            key={domain.id}
            onClick={() => setFilterDomain(domain.name)}
            className={`filter-chip ${filterDomain === domain.name ? 'active' : ''}`}
            style={filterDomain === domain.name ? {
              backgroundColor: getDomainColor(domain.name),
              borderColor: getDomainColor(domain.name),
              color: 'white'
            } : {}}
          >
            {domain.name}
          </button>
        ))}
      </div>

      {/* News Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : getFilteredNews().domainFilteredNews.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <Newspaper size={40} />
          </div>
          <h3 className="empty-state-title">No articles found</h3>
          <p className="empty-state-text">
            {searchTerm ? 'Try adjusting your search terms' : 'No articles available yet'}
          </p>
        </div>
      ) : (
        <>
          {/* Articles Counter */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 'var(--spacing-4)',
            padding: 'var(--spacing-3) var(--spacing-4)',
            backgroundColor: 'var(--bg-primary)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-color)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
              <Newspaper size={18} style={{ color: 'var(--primary-600)' }} />
              <span style={{
                fontSize: 'var(--font-size-sm)',
                fontWeight: 'var(--font-weight-medium)',
                color: 'var(--text-primary)'
              }}>
                {getFilteredNews().domainFilteredNews.length} article{getFilteredNews().domainFilteredNews.length > 1 ? 's' : ''}
                {filterDomain !== 'all' && ` in ${filterDomain}`}
                {searchTerm && ` matching "${searchTerm}"`}
              </span>
            </div>
            {getFilteredNews().domainFilteredNews.length > 4 && (
              <span style={{
                fontSize: 'var(--font-size-xs)',
                color: 'var(--text-tertiary)',
                fontStyle: 'italic'
              }}>
                Scroll down to see more
              </span>
            )}
          </div>

          <div className="grid grid-cols-2">
            {getFilteredNews().domainFilteredNews.map(item => (
              <div key={item.id} className="card-article">
                <div className="card-article-content">
                  <div className="card-article-header">
                    <span
                      className="badge"
                      style={{
                        backgroundColor: getDomainColor(item.domain) + '20',
                        color: getDomainColor(item.domain)
                      }}
                    >
                      {item.domain}
                    </span>
                    {isNewArticle(item.date) && (
                      <span className="badge badge-success">New</span>
                    )}
                  </div>

                  <h3 className="card-article-title">{item.title}</h3>
                  <p className="card-article-text">{item.content}</p>

                  <div className="card-article-footer">
                    <div className="flex items-center gap-2">
                      <User size={14} />
                      <span>{item.author}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar size={14} />
                      <span>{new Date(item.date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>{calculateReadingTime(item.content)} min read</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );

  // Contributor View Component
  const ContributorView = () => {
    console.log('Rendering ContributorView with contributorNews:', contributorNews);
    console.log('Number of articles in contributorNews:', contributorNews.length);
    return (
    <div className="animate-fadeIn">
      <div className="section-header">
        <h2 className="section-title">Manage Your Articles</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={handleOpenNewNews}
            className="btn btn-success"
          >
            <Plus size={20} />
            Add Article
          </button>
          <button
            onClick={testFetchContributorData}
            className="btn btn-secondary"
            style={{ marginLeft: '10px' }}
          >
            Test Fetch
          </button>
        </div>
      </div>

      {/* Add News Form */}
      {showAddNews && (
        <div className="card" style={{ marginBottom: 'var(--spacing-6)' }}>
          <h3 style={{ marginBottom: 'var(--spacing-4)' }}>{editingNews ? 'Edit Article' : 'New Article'}</h3>
          <form onSubmit={handleSaveNews}>
            <div className="form-group">
              <label className="form-label">Title</label>
              <input
                type="text"
                placeholder="Enter article title"
                value={newNews.title}
                onChange={(e) => setNewNews({ ...newNews, title: e.target.value })}
                className="form-input"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Content</label>
              <textarea
                placeholder="Write your article content..."
                value={newNews.content}
                onChange={(e) => setNewNews({ ...newNews, content: e.target.value })}
                className="form-textarea"
                required
              />
            </div>
            <div className="flex gap-3">
              <button type="submit" className="btn btn-success">
                Publish Article
              </button>
              <button
                type="button"
                onClick={handleCancelNews}
                className="btn btn-outline"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Articles List */}
      <div>
        <p>Total articles to display: {contributorNews.length}</p>
        {contributorNews.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <Newspaper size={40} />
            </div>
            <h3 className="empty-state-title">No articles yet</h3>
            <p className="empty-state-text">Start by creating your first article</p>
          </div>
        ) : (
          <div className="grid grid-cols-1">
            {contributorNews.map(item => (
              <div key={item.id} className="card">
                <div className="flex items-start justify-between gap-4">
                  <div style={{ flex: 1 }}>
                    <div className="flex items-center gap-3" style={{ marginBottom: 'var(--spacing-2)' }}>
                      <span
                        className="badge"
                        style={{
                          backgroundColor: getDomainColor(item.domain) + '20',
                          color: getDomainColor(item.domain)
                        }}
                      >
                        {item.domain}
                      </span>
                      {item.pending_validation && (
                        <span className="badge badge-warning">Pending Validation</span>
                      )}
                      <span className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                        {new Date(item.date).toLocaleDateString()}
                      </span>
                    </div>
                    <h3 style={{ marginBottom: 'var(--spacing-2)' }}>{item.title}</h3>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: 0 }}>{item.content}</p>
                  </div>
                  <div className="flex gap-2">
                    {(currentUser.role === 'super_admin' || currentUser.role === 'domain_admin' || 
                      (item.author && currentUser.username && 
                       item.author.toString().trim() === currentUser.username.toString().trim())) && (
                      <>
                        <button
                          onClick={() => {
                            setEditingNews(item);
                            setNewNews({
                              title: item.title,
                              content: item.content,
                              domain: item.domain
                            });
                            setShowAddNews(true);
                          }}
                          className="btn-icon"
                          style={{ color: 'var(--primary-600)' }}
                        >
                          <Edit size={20} />
                        </button>
                        <button
                          onClick={() => handleDeleteNews(item.id)}
                          className="btn-icon"
                          style={{ color: 'var(--error-600)' }}
                        >
                          <Trash2 size={20} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
    );
  };

  // Admin View Component
  const AdminView = () => (
    <div className="animate-fadeIn">
      {/* Domains Management */}
      <div style={{ marginBottom: 'var(--spacing-12)' }}>
        <div className="section-header">
          <h2 className="section-title">Manage Domains</h2>
          <button
            onClick={handleOpenNewDomain}
            className="btn btn-secondary"
          >
            <Plus size={20} />
            Add Domain
          </button>
        </div>

        {/* Add Domain Form */}
        {showAddDomain && (
          <div className="card" style={{ marginBottom: 'var(--spacing-6)' }}>
            <h3 style={{ marginBottom: 'var(--spacing-4)' }}>{editingDomain ? 'Edit Domain' : 'New Domain'}</h3>
            <form onSubmit={handleSaveDomain}>
              <div className="form-group">
                <label className="form-label">Domain Name</label>
                <input
                  type="text"
                  placeholder="e.g., Technology, Business"
                  value={newDomain.name}
                  onChange={(e) => setNewDomain({ ...newDomain, name: e.target.value })}
                  className="form-input"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Color</label>
                <div className="flex gap-3 flex-wrap">
                  {availableColors.map(color => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => setNewDomain({ ...newDomain, color: color.value })}
                      style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: 'var(--radius-lg)',
                        backgroundColor: color.value,
                        border: newDomain.color === color.value ? '4px solid var(--gray-800)' : '2px solid var(--border-color)',
                        cursor: 'pointer',
                        transition: 'all var(--transition-fast)'
                      }}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>
              <div className="flex gap-3">
                <button type="submit" className="btn btn-secondary">
                  {editingDomain ? 'Update Domain' : 'Create Domain'}
                </button>
                <button
                  type="button"
                  onClick={handleCancelDomain}
                  className="btn btn-outline"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Domains Grid */}
        <div className="grid grid-cols-3">
          {domains.map(domain => (
            <div key={domain.id} className="card">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: 'var(--radius-lg)',
                      backgroundColor: getDomainColor(domain.name),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontWeight: 'var(--font-weight-bold)',
                      fontSize: 'var(--font-size-xl)'
                    }}
                  >
                    {domain.name.charAt(0)}
                  </div>
                  <div>
                    <h3 style={{ margin: 0, marginBottom: 'var(--spacing-1)' }}>{domain.name}</h3>
                    <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', color: 'var(--text-tertiary)' }}>
                      {news.filter(n => n.domain === domain.name).length} articles
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditDomain(domain)}
                    className="btn-icon"
                    style={{ color: 'var(--primary-600)' }}
                  >
                    <Edit size={20} />
                  </button>
                  <button
                    onClick={() => handleDeleteDomain(domain.id)}
                    className="btn-icon"
                    style={{ color: 'var(--error-600)' }}
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Users Management */}
      <div style={{ marginBottom: 'var(--spacing-12)' }}>
        <div className="section-header">
          <h2 className="section-title">Manage Users</h2>
          <button
            onClick={handleOpenNewUser}
            className="btn btn-success"
          >
            <Plus size={20} />
            Add User
          </button>
        </div>

        {/* Add User Form */}
        {showAddUser && (
          <div className="card" style={{ marginBottom: 'var(--spacing-6)' }}>
            <h3 style={{ marginBottom: 'var(--spacing-4)' }}>{editingUser ? 'Edit User' : 'New User'}</h3>
            <form onSubmit={handleSaveUser}>
              <div className="form-group">
                <label className="form-label">Username</label>
                <input
                  type="text"
                  placeholder="Enter username"
                  value={newUser.username}
                  onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                  className="form-input"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  placeholder="Enter email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="form-input"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">
                  Password {editingUser && <span style={{ color: 'var(--text-tertiary)', fontWeight: 'var(--font-weight-normal)', fontSize: 'var(--font-size-xs)' }}>(leave empty to keep current)</span>}
                </label>
                <input
                  type="password"
                  placeholder={editingUser ? "Leave empty to keep current password" : "Enter password"}
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="form-input"
                  style={editingUser ? { backgroundColor: 'var(--bg-tertiary)', fontStyle: 'italic' } : {}}
                  required={!editingUser}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Role</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  className="form-select"
                >
                  <option value="contributor">Contributor</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              {newUser.role === 'contributor' && (
                <div className="form-group">
                  <label className="form-label">Domain</label>
                  <select
                    value={newUser.domain}
                    onChange={(e) => setNewUser({ ...newUser, domain: e.target.value })}
                    className="form-select"
                    required
                  >
                    <option value="">Select domain</option>
                    {domains.map(domain => (
                      <option key={domain.id} value={domain.name}>{domain.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="flex gap-3">
                <button type="submit" className="btn btn-success">
                  {editingUser ? 'Update User' : 'Create User'}
                </button>
                <button
                  type="button"
                  onClick={handleCancelUser}
                  className="btn btn-outline"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Users Grid */}
        <div className="grid grid-cols-3">
          {users.map(user => (
            <div key={user.id} className="card">
              <div className="flex items-center gap-3" style={{ marginBottom: 'var(--spacing-4)' }}>
                <div className="avatar">
                  {user.username.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: 0, marginBottom: 'var(--spacing-1)' }}>{user.username}</h3>
                  <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', color: 'var(--text-tertiary)' }}>
                    {user.email}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <span className={`badge ${user.role === 'super_admin' || user.role === 'domain_admin' ? 'badge-secondary' : 'badge-primary'}`}>
                    {user.role}
                  </span>
                  {user.domain && (
                    <span className="badge badge-success">{user.domain}</span>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditUser(user)}
                    className="btn-icon"
                    style={{ color: 'var(--primary-600)' }}
                  >
                    <Edit size={20} />
                  </button>
                  <button
                    onClick={() => handleDeleteUser(user.id)}
                    className="btn-icon"
                    style={{ color: 'var(--error-600)' }}
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* All News Management */}
      <div>
        <h2 className="section-title">All Articles</h2>
        <div className="grid grid-cols-1">
          {news.map(item => (
            <div key={item.id} className="card">
              <div className="flex items-start justify-between gap-4">
                <div style={{ flex: 1 }}>
                  <div className="flex items-center gap-3" style={{ marginBottom: 'var(--spacing-2)' }}>
                    <span
                      className="badge"
                      style={{
                        backgroundColor: getDomainColor(item.domain) + '20',
                        color: getDomainColor(item.domain)
                      }}
                    >
                      {item.domain}
                    </span>
                    <span className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                      {new Date(item.date).toLocaleDateString()}
                    </span>
                    <span className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                      by {item.author}
                    </span>
                  </div>
                  <h3 style={{ marginBottom: 'var(--spacing-2)' }}>{item.title}</h3>
                  <p style={{ color: 'var(--text-secondary)', marginBottom: 0 }}>{item.content}</p>
                </div>
                <div className="flex gap-2">
                  {(currentUser.role === 'super_admin' || currentUser.role === 'domain_admin' || 
                    (item.author && currentUser.username && 
                     item.author.toString().trim() === currentUser.username.toString().trim())) && (
                    <>
                      <button
                        onClick={() => handleEditNews(item)}
                        className="btn-icon"
                        style={{ color: 'var(--primary-600)' }}
                      >
                        <Edit size={20} />
                      </button>
                      <button
                        onClick={() => handleDeleteNews(item.id)}
                        className="btn-icon"
                        style={{ color: 'var(--error-600)' }}
                      >
                        <Trash2 size={20} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

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
            {/* Dark Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              className="theme-toggle"
              aria-label="Toggle dark mode"
            >
              <div className="theme-toggle-slider">
                {darkMode ? <Moon className="theme-toggle-icon" /> : <Sun className="theme-toggle-icon" />}
              </div>
            </button>

            {/* View Switcher for logged-in users */}
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
                {currentUser.role === 'super_admin' || currentUser.role === 'domain_admin' && (
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

            {/* User Menu */}
            {currentUser ? (
              <div className="flex items-center gap-3">
                <div className="avatar avatar-sm">
                  {currentUser.username.charAt(0).toUpperCase()}
                </div>
                <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)', display: 'none' }} className="md-inline">
                  {currentUser.username}
                </span>
                <button
                  onClick={handleLogout}
                  className="btn btn-ghost btn-sm"
                >
                  <LogOut size={16} />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowLogin(true)}
                className="btn btn-primary"
              >
                <User size={16} />
                Login
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content">
        {/* TEST BUTTON - This should help us verify JS is working */}
        <button 
          onClick={() => console.log('TEST BUTTON CLICKED')} 
          style={{ position: 'fixed', top: 10, left: 10, zIndex: 9999, background: 'red', color: 'white', padding: '10px' }}
        >
          TEST BUTTON
        </button>
        
        {currentView === 'public' && <PublicView />}
        {currentView === 'contributor' && <ContributorView />}
        {currentView === 'admin' && <AdminView />}
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
      {showLogin && (
        <div className="modal-backdrop" onClick={() => setShowLogin(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-icon">
                <User size={32} />
              </div>
              <h2 className="modal-title">Welcome Back</h2>
              <p className="modal-subtitle">Sign in to your account</p>
            </div>
            <div className="modal-body">
              <form onSubmit={handleLogin}>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    value={loginForm.email}
                    onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                    className="form-input"
                    placeholder="Enter your email"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Password</label>
                  <input
                    type="password"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                    className="form-input"
                    placeholder="Enter your password"
                    required
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowLogin(false)}
                    className="btn btn-outline"
                    style={{ flex: 1 }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ flex: 1 }}
                  >
                    Sign In
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Notification Toast */}
      {notification && (
        <div className={`notification notification-${notification.type}`}>
          {notification.message}
        </div>
      )}
    </div>
  );
};

export default App;