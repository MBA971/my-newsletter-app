import React, { useState, useEffect } from 'react';
import { Search, User, LogIn, LogOut, Plus, Edit, Trash2, Eye, Users, Settings, Globe, Lock, Calendar, Tag } from 'lucide-react';

const App = () => {
  const [domains, setDomains] = useState([]);
  const [news, setNews] = useState([]);
  const [users, setUsers] = useState([]);
  const [subscribers, setSubscribers] = useState([]);
  const [currentView, setCurrentView] = useState('public'); // public, contributor, admin
  const [currentUser, setCurrentUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showLogin, setShowLogin] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [notification, setNotification] = useState(null);
  const [showAddNews, setShowAddNews] = useState(false);
  const [newNews, setNewNews] = useState({ title: '', content: '', domain: '' });
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState({ username: '', email: '', password: '', role: 'contributor', domain: '' });
  const [filterDomain, setFilterDomain] = useState('all');
  const [showAddDomain, setShowAddDomain] = useState(false);
  const [newDomain, setNewDomain] = useState({ name: '', color: 'bg-blue-500' });

  // Available colors for domains
  const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-red-500', 'bg-pink-500', 'bg-yellow-500', 'bg-indigo-500'];

  // Fetch public data from the backend
  const fetchPublicData = async () => {
    try {
      // Use environment variable for API base URL, fallback to localhost if not set
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3002';
      
      const [domainsRes, newsRes] = await Promise.all([
        fetch(`${apiUrl}/api/domains`),
        fetch(`${apiUrl}/api/news`)
      ]);

      if (domainsRes.ok && newsRes.ok) {
        setDomains(await domainsRes.json());
        setNews(await newsRes.json());
      }
    } catch (error) {
      console.error('Error fetching public data:', error);
    }
  };

  // Fetch protected data from the backend (only when user is authenticated)
  const fetchProtectedData = async () => {
    if (!currentUser) return;

    try {
      // Use environment variable for API base URL, fallback to localhost if not set
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3002';
      
      const requests = [];
      const requestNames = [];

      // Always fetch users and subscribers for admin users
      if (currentUser.role === 'admin') {
        requests.push(fetch(`${apiUrl}/api/users`));
        requestNames.push('users');
        requests.push(fetch(`${apiUrl}/api/subscribers`));
        requestNames.push('subscribers');
      }

      if (requests.length > 0) {
        const responses = await Promise.all(requests);
        
        for (let i = 0; i < responses.length; i++) {
          if (responses[i].ok) {
            const data = await responses[i].json();
            switch (requestNames[i]) {
              case 'users':
                setUsers(data);
                break;
              case 'subscribers':
                setSubscribers(data);
                break;
            }
          }
        }
      }
    } catch (error) {
      console.error('Error fetching protected data:', error);
    }
  };

  useEffect(() => {
    // Fetch public data for all users
    fetchPublicData();
  }, []);

  useEffect(() => {
    // Fetch protected data only for authenticated users
    fetchProtectedData();
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
      // Use environment variable for API base URL, fallback to localhost if not set
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3002';
      
      const response = await fetch(`${apiUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies in the request
        body: JSON.stringify(loginForm),
      });

      if (response.ok) {
        const userData = await response.json();
        setCurrentUser(userData.user);
        setCurrentView(userData.user.role === 'admin' ? 'admin' : 'contributor');
        setShowLogin(false);
        showNotification(`Welcome back, ${userData.user.username}!`);
        
        // Fetch protected data after successful login
        fetchProtectedData();
      } else {
        const errorData = await response.json();
        showNotification(errorData.error || 'Invalid credentials', 'error');
      }
    } catch (error) {
      showNotification('Login failed', 'error');
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      // Use environment variable for API base URL, fallback to localhost if not set
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3002';
      
      await fetch(`${apiUrl}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include', // Include cookies in the request
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
    
    setCurrentUser(null);
    setCurrentView('public');
    setUsers([]);
    setSubscribers([]);
    setFilterDomain('all');
    showNotification('You have been logged out');
  };

  // Filter news based on search term
  const filteredNews = news.filter(item =>
    item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.author.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filter news by domain
  const domainFilteredNews = filterDomain === 'all' 
    ? filteredNews 
    : filteredNews.filter(n => n.domain === filterDomain);

  // Filter news by domain for contributors
  const contributorNews = currentUser && currentUser.role === 'contributor' 
    ? news.filter(item => item.domain === currentUser.domain)
    : [];

  // Handle adding news
  const handleAddNews = async (e) => {
    e.preventDefault();
    try {
      // Use environment variable for API base URL, fallback to localhost if not set
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3002';
      
      const response = await fetch(`${apiUrl}/api/news`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newNews,
          author: currentUser.username,
          domain: currentUser.role === 'admin' ? newNews.domain : currentUser.domain
        }),
      });

      if (response.ok) {
        const addedNews = await response.json();
        setNews([addedNews, ...news]);
        setNewNews({ title: '', content: '', domain: '' });
        setShowAddNews(false);
        showNotification('News added successfully');
        fetchData(); // Refresh data
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
      // Use environment variable for API base URL, fallback to localhost if not set
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3002';
      
      const response = await fetch(`${apiUrl}/api/news/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setNews(news.filter(item => item.id !== id));
        showNotification('News deleted successfully');
      } else {
        showNotification('Failed to delete news', 'error');
      }
    } catch (error) {
      showNotification('Error deleting news', 'error');
    }
  };

  // Handle adding user (admin only)
  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      // Use environment variable for API base URL, fallback to localhost if not set
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3002';
      
      const response = await fetch(`${apiUrl}/api/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newUser),
      });

      if (response.ok) {
        const addedUser = await response.json();
        setUsers([...users, addedUser]);
        setNewUser({ username: '', email: '', password: '', role: 'contributor', domain: '' });
        setShowAddUser(false);
        showNotification('User added successfully');
        fetchData(); // Refresh data
      } else {
        showNotification('Failed to add user', 'error');
      }
    } catch (error) {
      showNotification('Error adding user', 'error');
    }
  };

  // Handle deleting user (admin only)
  const handleDeleteUser = async (id) => {
    try {
      // Use environment variable for API base URL, fallback to localhost if not set
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3002';
      
      const response = await fetch(`${apiUrl}/api/users/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setUsers(users.filter(user => user.id !== id));
        showNotification('User deleted successfully');
      } else {
        showNotification('Failed to delete user', 'error');
      }
    } catch (error) {
      showNotification('Error deleting user', 'error');
    }
  };

  // Handle adding domain (admin only)
  const handleAddDomain = async (e) => {
    e.preventDefault();
    try {
      // Use environment variable for API base URL, fallback to localhost if not set
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3002';
      
      const response = await fetch(`${apiUrl}/api/domains`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newDomain),
      });

      if (response.ok) {
        const addedDomain = await response.json();
        setDomains([...domains, addedDomain]);
        setNewDomain({ name: '', color: 'bg-blue-500' });
        setShowAddDomain(false);
        showNotification('Domain added successfully');
        fetchData(); // Refresh data
      } else {
        showNotification('Failed to add domain', 'error');
      }
    } catch (error) {
      showNotification('Error adding domain', 'error');
    }
  };

  // Handle deleting domain (admin only)
  const handleDeleteDomain = async (id) => {
    try {
      // Use environment variable for API base URL, fallback to localhost if not set
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3002';
      
      const response = await fetch(`${apiUrl}/api/domains/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setDomains(domains.filter(domain => domain.id !== id));
        showNotification('Domain deleted successfully');
        fetchData(); // Refresh data
      } else {
        showNotification('Failed to delete domain', 'error');
      }
    } catch (error) {
      showNotification('Error deleting domain', 'error');
    }
  };

  // Public view component
  const PublicView = () => (
    <div>
      {/* Search Bar */}
      <div className="mb-8">
        <div className="relative max-w-2xl mx-auto">
          <input
            type="text"
            placeholder="Search articles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
          />
          <Search className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex gap-2 flex-wrap">
        <button
          onClick={() => setFilterDomain('all')}
          className={`px-4 py-2 rounded-full transition ${filterDomain === 'all' ? 'bg-slate-800 text-white' : 'bg-white text-slate-700 hover:bg-slate-100 shadow-sm'}`}
        >
          All News
        </button>
        {domains.map(domain => (
          <button
            key={domain.id}
            onClick={() => setFilterDomain(domain.name)}
            className={`px-4 py-2 rounded-full transition ${filterDomain === domain.name ? `${domain.color} text-white` : 'bg-white text-slate-700 hover:bg-slate-100 shadow-sm'}`}
          >
            {domain.name}
          </button>
        ))}
      </div>

      {/* News Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {domainFilteredNews.map(item => {
          const domain = domains.find(d => d.name === item.domain);
          return (
            <div key={item.id} className="bg-white rounded-xl shadow-sm hover:shadow-md transition p-6">
              <div className="flex items-start justify-between mb-3">
                <span className={`${domain?.color || 'bg-slate-500'} text-white text-xs px-3 py-1 rounded-full font-medium`}>
                  {item.domain}
                </span>
                <span className="text-xs text-slate-500 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(item.date).toLocaleDateString()}
                </span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">{item.title}</h3>
              <p className="text-slate-600 mb-4">{item.content}</p>
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <User className="w-4 h-4" />
                {item.author}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  // Contributor view component
  const ContributorView = () => (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Manage News</h2>
        <button
          onClick={() => setShowAddNews(!showAddNews)}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition shadow-sm"
        >
          <Plus className="w-5 h-5" />
          Add News
        </button>
      </div>

      {/* Add News Form */}
      {showAddNews && (
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h3 className="font-bold text-lg mb-4">New Article</h3>
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Title"
              value={newNews.title}
              onChange={(e) => setNewNews({...newNews, title: e.target.value})}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
            <textarea
              placeholder="Content"
              value={newNews.content}
              onChange={(e) => setNewNews({...newNews, content: e.target.value})}
              className="w-full px-4 py-2 border rounded-lg h-32 focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
            <div className="flex gap-2">
              <button
                onClick={handleAddNews}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition"
              >
                Publish
              </button>
              <button
                onClick={() => setShowAddNews(false)}
                className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-6 py-2 rounded-lg transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* News List */}
      <div className="space-y-4">
        {contributorNews.map(item => {
          const domain = domains.find(d => d.name === item.domain);
          return (
            <div key={item.id} className="bg-white rounded-xl shadow-sm p-6 flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className={`${domain?.color || 'bg-slate-500'} text-white text-xs px-3 py-1 rounded-full`}>
                    {item.domain}
                  </span>
                  <span className="text-sm text-slate-500">{new Date(item.date).toLocaleDateString()}</span>
                </div>
                <h3 className="font-bold text-lg text-slate-900">{item.title}</h3>
                <p className="text-slate-600 text-sm mt-1">{item.content}</p>
              </div>
              <button
                onClick={() => handleDeleteNews(item.id)}
                className="ml-4 p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );

  // Admin view component
  const AdminView = () => (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Manage Domains</h2>
        <button
          onClick={() => setShowAddDomain(!showAddDomain)}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition shadow-sm"
        >
          <Plus className="w-5 h-5" />
          Add Domain
        </button>
      </div>

      {/* Add Domain Form */}
      {showAddDomain && (
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h3 className="font-bold text-lg mb-4">New Domain</h3>
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Domain Name"
              value={newDomain.name}
              onChange={(e) => setNewDomain({...newDomain, name: e.target.value})}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Color</label>
              <div className="flex gap-2">
                {colors.map(color => (
                  <button
                    key={color}
                    onClick={() => setNewDomain({...newDomain, color})}
                    className={`w-10 h-10 rounded-lg ${color} ${newDomain.color === color ? 'ring-4 ring-slate-300' : ''}`}
                  />
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleAddDomain}
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg transition"
              >
                Create
              </button>
              <button
                onClick={() => setShowAddDomain(false)}
                className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-6 py-2 rounded-lg transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Domains Grid */}
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        {domains.map(domain => (
          <div key={domain.id} className="bg-white rounded-xl shadow-sm p-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 ${domain.color} rounded-lg`}></div>
              <div>
                <h3 className="font-bold text-slate-900">{domain.name}</h3>
                <p className="text-sm text-slate-500">{news.filter(n => n.domain === domain.name).length} articles</p>
              </div>
            </div>
            <button
              onClick={() => handleDeleteDomain(domain.id)}
              className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        ))}
      </div>

      {/* Users Management */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-slate-900">Manage Users</h2>
          <button
            onClick={() => setShowAddUser(!showAddUser)}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition shadow-sm"
          >
            <Plus className="w-5 h-5" />
            Add User
          </button>
        </div>

        {/* Add User Form */}
        {showAddUser && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <h3 className="font-bold text-lg mb-4">New User</h3>
            <form onSubmit={handleAddUser} className="space-y-4">
              <input
                type="text"
                placeholder="Username"
                value={newUser.username}
                onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              />
              <input
                type="email"
                placeholder="Email"
                value={newUser.email}
                onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              />
              <input
                type="password"
                placeholder="Password"
                value={newUser.password}
                onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              />
              <select
                value={newUser.role}
                onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="contributor">Contributor</option>
                <option value="admin">Admin</option>
              </select>
              {newUser.role === 'contributor' && (
                <select
                  value={newUser.domain}
                  onChange={(e) => setNewUser({...newUser, domain: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">Select domain</option>
                  {domains.map(domain => (
                    <option key={domain.id} value={domain.name}>{domain.name}</option>
                  ))}
                </select>
              )}
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition"
                >
                  Create User
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddUser(false)}
                  className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-6 py-2 rounded-lg transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Users List */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {users.map(user => (
            <div key={user.id} className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-slate-200 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-slate-600" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">{user.username}</h3>
                  <p className="text-sm text-slate-500">{user.email}</p>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'
                }`}>
                  {user.role}
                </span>
                {user.domain && (
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {user.domain}
                  </span>
                )}
                <button
                  onClick={() => handleDeleteUser(user.id)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* News Management */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-6">Manage News</h2>
        <div className="space-y-4">
          {news.map(item => {
            const domain = domains.find(d => d.name === item.domain);
            return (
              <div key={item.id} className="bg-white rounded-xl shadow-sm p-6 flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`${domain?.color || 'bg-slate-500'} text-white text-xs px-3 py-1 rounded-full`}>
                      {item.domain}
                    </span>
                    <span className="text-sm text-slate-500">{new Date(item.date).toLocaleDateString()}</span>
                  </div>
                  <h3 className="font-bold text-lg text-slate-900">{item.title}</h3>
                  <p className="text-slate-600 text-sm mt-1">{item.content}</p>
                </div>
                <button
                  onClick={() => handleDeleteNews(item.id)}
                  className="ml-4 p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Company Newsletter</h1>
              <p className="text-sm text-slate-500">Stay updated with all departments</p>
            </div>
            
            <div className="flex items-center gap-4">
              {/* View Switcher for logged-in users */}
              {currentUser && (
                <div className="flex gap-2 bg-slate-100 p-1 rounded-lg">
                  <button
                    onClick={() => setCurrentView('public')}
                    className={`px-4 py-2 rounded-md flex items-center gap-2 transition ${currentView === 'public' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-600'}`}
                  >
                    <Globe className="w-4 h-4" />
                    Public View
                  </button>
                  <button
                    onClick={() => setCurrentView('contributor')}
                    className={`px-4 py-2 rounded-md flex items-center gap-2 transition ${currentView === 'contributor' ? 'bg-white shadow-sm text-green-600' : 'text-slate-600'}`}
                  >
                    <Edit className="w-4 h-4" />
                    Contributor
                  </button>
                  {currentUser.role === 'admin' && (
                    <button
                      onClick={() => setCurrentView('admin')}
                      className={`px-4 py-2 rounded-md flex items-center gap-2 transition ${currentView === 'admin' ? 'bg-white shadow-sm text-purple-600' : 'text-slate-600'}`}
                    >
                      <Lock className="w-4 h-4" />
                      Admin
                    </button>
                  )}
                </div>
              )}
              
              {/* User Menu */}
              <div className="flex items-center">
                {currentUser ? (
                  <div className="flex items-center space-x-4">
                    <span className="text-sm font-medium text-slate-700 hidden md:inline">
                      {currentUser.username}
                    </span>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg transition-colors duration-200"
                    >
                      <LogOut className="h-4 w-4" />
                      <span className="hidden sm:inline">Logout</span>
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowLogin(true)}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 shadow-sm"
                  >
                    <User className="h-4 w-4" />
                    <span>Login</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {currentView === 'public' && <PublicView />}
        {currentView === 'contributor' && <ContributorView />}
        {currentView === 'admin' && <AdminView />}
      </main>

      {/* Login Modal */}
      {showLogin && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-8 shadow-2xl">
            <div className="text-center mb-6">
              <div className="mx-auto bg-slate-100 rounded-full p-3 w-16 h-16 flex items-center justify-center mb-4">
                <User className="h-8 w-8 text-slate-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">Welcome Back</h2>
              <p className="text-slate-600 mt-2">Sign in to your account</p>
            </div>
            <form onSubmit={handleLogin}>
              <div className="mb-5">
                <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                <input
                  type="email"
                  value={loginForm.email}
                  onChange={(e) => setLoginForm({...loginForm, email: e.target.value})}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-2">Password</label>
                <input
                  type="password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => setShowLogin(false)}
                  className="flex-1 px-4 py-3 text-slate-700 hover:text-slate-900 font-medium rounded-lg border border-slate-300 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors shadow-sm"
                >
                  Sign In
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
          notification.type === 'error' ? 'bg-red-500 text-white' : 'bg-green-500 text-white'
        }`}>
          {notification.message}
        </div>
      )}
    </div>
  );
};

export default App;