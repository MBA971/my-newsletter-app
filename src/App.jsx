import React, { useState, useEffect } from 'react';
import { Search, User, LogOut, Plus, Trash2, Calendar, Sun, Moon, Mail, Newspaper } from 'lucide-react';
import './App.css';

const App = () => {
  // State management
  const [domains, setDomains] = useState([]);
  const [news, setNews] = useState([]);
  const [users, setUsers] = useState([]);
  const [subscribers, setSubscribers] = useState([]);
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

  // Fetch data from backend
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3002';

      // Always fetch public data
      const [domainsRes, newsRes] = await Promise.all([
        fetch(`${apiUrl}/api/domains`, { credentials: 'include' }),
        fetch(`${apiUrl}/api/news`, { credentials: 'include' })
      ]);

      if (domainsRes.ok) setDomains(await domainsRes.json());
      if (newsRes.ok) setNews(await newsRes.json());

      // Try to fetch protected data (will fail if not admin, which is fine)
      try {
        const [usersRes, subscribersRes] = await Promise.all([
          fetch(`${apiUrl}/api/users`, { credentials: 'include' }),
          fetch(`${apiUrl}/api/subscribers`, { credentials: 'include' })
        ]);

        if (usersRes.ok) setUsers(await usersRes.json());
        if (subscribersRes.ok) setSubscribers(await subscribersRes.json());
      } catch (e) {
        // Ignore errors for protected routes when not logged in
      }

    } catch (error) {
      console.error('Error fetching data:', error);
      showNotification('Failed to load data', 'error');
    } finally {
      setTimeout(() => setIsLoading(false), 500);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Show notification
  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // Handle login
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3002';
      const response = await fetch(`${apiUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(loginForm)
      });

      if (response.ok) {
        const data = await response.json();
        const user = data.user;
        setCurrentUser(user);
        setCurrentView(user.role === 'admin' ? 'admin' : 'contributor');
        setShowLogin(false);
        showNotification(`Welcome back, ${user.username}!`, 'success');
        setLoginForm({ email: '', password: '' });
      } else {
        const error = await response.json();
        showNotification(error.error || 'Login failed', 'error');
      }
    } catch (error) {
      showNotification('Login failed', 'error');
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3002';
      await fetch(`${apiUrl}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      });
      setCurrentUser(null);
      setCurrentView('public');
      setFilterDomain('all');
      showNotification('Logged out successfully', 'info');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Filter news
  const filteredNews = news.filter(item =>
    item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.author.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const domainFilteredNews = filterDomain === 'all'
    ? filteredNews
    : filteredNews.filter(n => n.domain === filterDomain);

  const contributorNews = currentUser && currentUser.role === 'contributor'
    ? news.filter(item => item.domain === currentUser.domain)
    : [];

  // Handle adding news
  const handleAddNews = async (e) => {
    e.preventDefault();
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3002';

      const response = await fetch(`${apiUrl}/api/news`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...newNews,
          author: currentUser.username,
          domain: currentUser.role === 'contributor' ? currentUser.domain : newNews.domain
        })
      });

      if (response.ok) {
        setNewNews({ title: '', content: '', domain: '' });
        setShowAddNews(false);
        showNotification('News added successfully', 'success');
        fetchData();
      } else {
        showNotification('Failed to add news', 'error');
      }
    } catch (error) {
      showNotification('Error adding news', 'error');
    }
  };

  // Handle deleting news
  const handleDeleteNews = async (id) => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3002';
      const response = await fetch(`${apiUrl}/api/news/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        setNews(news.filter(item => item.id !== id));
        showNotification('News deleted successfully', 'success');
      } else {
        showNotification('Failed to delete news', 'error');
      }
    } catch (error) {
      showNotification('Error deleting news', 'error');
    }
  };

  // Handle adding user
  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3002';
      const response = await fetch(`${apiUrl}/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(newUser)
      });

      if (response.ok) {
        setNewUser({ username: '', email: '', password: '', role: 'contributor', domain: '' });
        setShowAddUser(false);
        showNotification('User added successfully', 'success');
        fetchData();
      } else {
        showNotification('Failed to add user', 'error');
      }
    } catch (error) {
      showNotification('Error adding user', 'error');
    }
  };

  // Handle deleting user
  const handleDeleteUser = async (id) => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3002';
      const response = await fetch(`${apiUrl}/api/users/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        setUsers(users.filter(user => user.id !== id));
        showNotification('User deleted successfully', 'success');
      } else {
        showNotification('Failed to delete user', 'error');
      }
    } catch (error) {
      showNotification('Error deleting user', 'error');
    }
  };

  // Handle adding domain
  const handleAddDomain = async (e) => {
    e.preventDefault();
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3002';
      const response = await fetch(`${apiUrl}/api/domains`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(newDomain)
      });

      if (response.ok) {
        setNewDomain({ name: '', color: '#3b82f6' });
        setShowAddDomain(false);
        showNotification('Domain added successfully', 'success');
        fetchData();
      } else {
        showNotification('Failed to add domain', 'error');
      }
    } catch (error) {
      showNotification('Error adding domain', 'error');
    }
  };

  // Handle deleting domain
  const handleDeleteDomain = async (id) => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3002';
      const response = await fetch(`${apiUrl}/api/domains/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        setDomains(domains.filter(domain => domain.id !== id));
        showNotification('Domain deleted successfully', 'success');
        fetchData();
      } else {
        showNotification('Failed to delete domain', 'error');
      }
    } catch (error) {
      showNotification('Error deleting domain', 'error');
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
      ) : domainFilteredNews.length === 0 ? (
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
                {domainFilteredNews.length} article{domainFilteredNews.length > 1 ? 's' : ''}
                {filterDomain !== 'all' && ` in ${filterDomain}`}
                {searchTerm && ` matching "${searchTerm}"`}
              </span>
            </div>
            {domainFilteredNews.length > 4 && (
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
            {domainFilteredNews.map(item => (
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
  const ContributorView = () => (
    <div className="animate-fadeIn">
      <div className="section-header">
        <h2 className="section-title">Manage Your Articles</h2>
        <button
          onClick={() => setShowAddNews(!showAddNews)}
          className="btn btn-success"
        >
          <Plus size={20} />
          Add Article
        </button>
      </div>

      {/* Add News Form */}
      {showAddNews && (
        <div className="card" style={{ marginBottom: 'var(--spacing-6)' }}>
          <h3 style={{ marginBottom: 'var(--spacing-4)' }}>New Article</h3>
          <form onSubmit={handleAddNews}>
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
                onClick={() => setShowAddNews(false)}
                className="btn btn-outline"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Articles List */}
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
                    <span className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                      {new Date(item.date).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 style={{ marginBottom: 'var(--spacing-2)' }}>{item.title}</h3>
                  <p style={{ color: 'var(--text-secondary)', marginBottom: 0 }}>{item.content}</p>
                </div>
                <button
                  onClick={() => handleDeleteNews(item.id)}
                  className="btn-icon"
                  style={{ color: 'var(--error-600)' }}
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // Admin View Component
  const AdminView = () => (
    <div className="animate-fadeIn">
      {/* Domains Management */}
      <div style={{ marginBottom: 'var(--spacing-12)' }}>
        <div className="section-header">
          <h2 className="section-title">Manage Domains</h2>
          <button
            onClick={() => setShowAddDomain(!showAddDomain)}
            className="btn btn-secondary"
          >
            <Plus size={20} />
            Add Domain
          </button>
        </div>

        {/* Add Domain Form */}
        {showAddDomain && (
          <div className="card" style={{ marginBottom: 'var(--spacing-6)' }}>
            <h3 style={{ marginBottom: 'var(--spacing-4)' }}>New Domain</h3>
            <form onSubmit={handleAddDomain}>
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
                  Create Domain
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddDomain(false)}
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
                <button
                  onClick={() => handleDeleteDomain(domain.id)}
                  className="btn-icon"
                  style={{ color: 'var(--error-600)' }}
                >
                  <Trash2 size={20} />
                </button>
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
            onClick={() => setShowAddUser(!showAddUser)}
            className="btn btn-success"
          >
            <Plus size={20} />
            Add User
          </button>
        </div>

        {/* Add User Form */}
        {showAddUser && (
          <div className="card" style={{ marginBottom: 'var(--spacing-6)' }}>
            <h3 style={{ marginBottom: 'var(--spacing-4)' }}>New User</h3>
            <form onSubmit={handleAddUser}>
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
                <label className="form-label">Password</label>
                <input
                  type="password"
                  placeholder="Enter password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="form-input"
                  required
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
                  Create User
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddUser(false)}
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
                  <span className={`badge ${user.role === 'admin' ? 'badge-secondary' : 'badge-primary'}`}>
                    {user.role}
                  </span>
                  {user.domain && (
                    <span className="badge badge-success">{user.domain}</span>
                  )}
                </div>
                <button
                  onClick={() => handleDeleteUser(user.id)}
                  className="btn-icon"
                  style={{ color: 'var(--error-600)' }}
                >
                  <Trash2 size={20} />
                </button>
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
                <button
                  onClick={() => handleDeleteNews(item.id)}
                  className="btn-icon"
                  style={{ color: 'var(--error-600)' }}
                >
                  <Trash2 size={20} />
                </button>
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