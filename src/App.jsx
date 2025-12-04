import React, { useState, useEffect } from 'react';
import { Search, User, LogIn, LogOut, Plus, Edit, Trash2, Eye, Users, Settings, Globe, Lock, Calendar, Tag, Mail, Newspaper } from 'lucide-react';
import './App.css';

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
        headers: {
          'Content-Type': 'application/json',
        },
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

  // Handle adding user
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
      // Use environment variable for API base URL, fallback to localhost if not set
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3002';
      
      const response = await fetch(`${apiUrl}/api/users/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
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

  // Handle adding domain
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
      // Use environment variable for API base URL, fallback to localhost if not set
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3002';
      
      const response = await fetch(`${apiUrl}/api/domains/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
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

  // Filter news by domain
  const domainFilteredNews = filterDomain === 'all' 
    ? filteredNews 
    : filteredNews.filter(n => n.domain === filterDomain);

  // Get domain color
  const getDomainColor = (domainName) => {
    const domain = domains.find(d => d.name === domainName);
    return domain ? domain.color : 'bg-gray-500';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
          notification.type === 'error' ? 'bg-red-500 text-white' : 'bg-green-500 text-white'
        }`}>
          {notification.message}
        </div>
      )}

      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Alenia Pulse</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              {currentUser ? (
                <>
                  <span className="text-sm text-gray-700">
                    Welcome, {currentUser.username} ({currentUser.role})
                  </span>
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-1 text-sm text-gray-700 hover:text-gray-900"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Logout</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setShowLogin(true)}
                  className="flex items-center space-x-1 text-sm text-gray-700 hover:text-gray-900"
                >
                  <LogIn className="h-4 w-4" />
                  <span>Login</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* View Switcher */}
        {currentUser && (
          <div className="mb-8 flex justify-center">
            <div className="flex bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setCurrentView('public')}
                className={`px-4 py-2 rounded-md ${
                  currentView === 'public' 
                    ? 'bg-white shadow-sm text-blue-600' 
                    : 'text-gray-700 hover:text-gray-900'
                }`}
              >
                Public View
              </button>
              {currentUser.role === 'contributor' && (
                <button
                  onClick={() => setCurrentView('contributor')}
                  className={`px-4 py-2 rounded-md ${
                    currentView === 'contributor' 
                      ? 'bg-white shadow-sm text-green-600' 
                      : 'text-gray-700 hover:text-gray-900'
                  }`}
                >
                  Contributor View
                </button>
              )}
              {currentUser.role === 'admin' && (
                <button
                  onClick={() => setCurrentView('admin')}
                  className={`px-4 py-2 rounded-md ${
                    currentView === 'admin' 
                      ? 'bg-white shadow-sm text-purple-600' 
                      : 'text-gray-700 hover:text-gray-900'
                  }`}
                >
                  Admin Panel
                </button>
              )}
            </div>
          </div>
        )}

        {/* Public View */}
        {(currentView === 'public' || !currentUser) && (
          <div>
            {/* Search Bar */}
            <div className="mb-8">
              <div className="relative max-w-2xl mx-auto">
                <input
                  type="text"
                  placeholder="Search articles..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
                />
                <Search className="absolute left-4 top-3.5 h-5 w-5 text-gray-400" />
              </div>
            </div>

            {/* Domain Filters */}
            <div className="mb-6 flex gap-2 flex-wrap justify-center">
              <button
                onClick={() => setFilterDomain('all')}
                className={`px-4 py-2 rounded-full transition ${
                  filterDomain === 'all' 
                    ? 'bg-gray-800 text-white' 
                    : 'bg-white text-gray-700 hover:bg-gray-100 shadow-sm'
                }`}
              >
                All News
              </button>
              {domains.map(domain => (
                <button
                  key={domain.id}
                  onClick={() => setFilterDomain(domain.name)}
                  className={`px-4 py-2 rounded-full transition ${
                    filterDomain === domain.name 
                      ? `${domain.color} text-white` 
                      : 'bg-white text-gray-700 hover:bg-gray-100 shadow-sm'
                  }`}
                >
                  {domain.name}
                </button>
              ))}
            </div>

            {/* News Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {domainFilteredNews.map(item => (
                <div key={item.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
                  <div className={`${getDomainColor(item.domain)} h-2 w-full`}></div>
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium text-white ${getDomainColor(item.domain)}`}>
                        {item.domain}
                      </span>
                      <span className="text-xs text-gray-500">{item.date}</span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h3>
                    <p className="text-gray-600 mb-4 line-clamp-3">{item.content}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">By {item.author}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Contributor View */}
        {currentView === 'contributor' && currentUser && currentUser.role === 'contributor' && (
          <div>
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Your News</h2>
              <button
                onClick={() => setShowAddNews(true)}
                className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
              >
                <Plus className="h-4 w-4" />
                <span>Add News</span>
              </button>
            </div>

            {/* News Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {contributorNews.map(item => (
                <div key={item.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
                  <div className={`${getDomainColor(item.domain)} h-2 w-full`}></div>
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium text-white ${getDomainColor(item.domain)}`}>
                        {item.domain}
                      </span>
                      <span className="text-xs text-gray-500">{item.date}</span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h3>
                    <p className="text-gray-600 mb-4 line-clamp-3">{item.content}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">By {item.author}</span>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleDeleteNews(item.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Admin View */}
        {currentView === 'admin' && currentUser && currentUser.role === 'admin' && (
          <div>
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Admin Dashboard</h2>
              <button
                onClick={() => setShowAdminPanel(!showAdminPanel)}
                className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition"
              >
                <Settings className="h-4 w-4" />
                <span>{showAdminPanel ? 'Hide' : 'Show'} Admin Panel</span>
              </button>
            </div>

            {showAdminPanel && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl shadow-md">
                  <div className="flex items-center">
                    <Newspaper className="h-8 w-8 text-blue-500 mr-3" />
                    <div>
                      <p className="text-2xl font-bold">{news.length}</p>
                      <p className="text-gray-600">Total News</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-md">
                  <div className="flex items-center">
                    <Users className="h-8 w-8 text-green-500 mr-3" />
                    <div>
                      <p className="text-2xl font-bold">{users.length}</p>
                      <p className="text-gray-600">Total Users</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-md">
                  <div className="flex items-center">
                    <Mail className="h-8 w-8 text-purple-500 mr-3" />
                    <div>
                      <p className="text-2xl font-bold">{subscribers.length}</p>
                      <p className="text-gray-600">Subscribers</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Admin Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <button
                onClick={() => setShowAddNews(true)}
                className="flex flex-col items-center justify-center p-6 bg-white rounded-xl shadow-md hover:shadow-lg transition"
              >
                <Plus className="h-8 w-8 text-blue-500 mb-2" />
                <span className="font-medium">Add News</span>
              </button>
              <button
                onClick={() => setShowAddUser(true)}
                className="flex flex-col items-center justify-center p-6 bg-white rounded-xl shadow-md hover:shadow-lg transition"
              >
                <User className="h-8 w-8 text-green-500 mb-2" />
                <span className="font-medium">Add User</span>
              </button>
              <button
                onClick={() => setShowAddDomain(true)}
                className="flex flex-col items-center justify-center p-6 bg-white rounded-xl shadow-md hover:shadow-lg transition"
              >
                <Tag className="h-8 w-8 text-purple-500 mb-2" />
                <span className="font-medium">Add Domain</span>
              </button>
            </div>

            {/* News Table */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden mb-8">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">All News</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Domain</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Author</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {news.map(item => (
                      <tr key={item.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{item.title}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full text-white ${getDomainColor(item.domain)}`}>
                            {item.domain}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.author}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.date}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleDeleteNews(item.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden mb-8">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Users</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Domain</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map(user => (
                      <tr key={user.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.username}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                            user.role === 'contributor' ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.domain || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Login Modal */}
      {showLogin && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-6 text-center">Login</h2>
            <form onSubmit={handleLogin}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={loginForm.email}
                  onChange={(e) => setLoginForm({...loginForm, email: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <input
                  type="password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowLogin(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Login
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add News Modal */}
      {showAddNews && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6">Add News</h2>
            <form onSubmit={handleAddNews}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                <input
                  type="text"
                  value={newNews.title}
                  onChange={(e) => setNewNews({...newNews, title: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              {currentUser && currentUser.role === 'admin' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Domain</label>
                  <select
                    value={newNews.domain}
                    onChange={(e) => setNewNews({...newNews, domain: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select a domain</option>
                    {domains.map(domain => (
                      <option key={domain.id} value={domain.name}>{domain.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Content</label>
                <textarea
                  value={newNews.content}
                  onChange={(e) => setNewNews({...newNews, content: e.target.value})}
                  rows={6}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddNews(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Add News
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showAddUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-6">Add User</h2>
            <form onSubmit={handleAddUser}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
                <input
                  type="text"
                  value={newUser.username}
                  onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="user">User</option>
                  <option value="contributor">Contributor</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              {newUser.role === 'contributor' && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Domain</label>
                  <select
                    value={newUser.domain}
                    onChange={(e) => setNewUser({...newUser, domain: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select a domain</option>
                    {domains.map(domain => (
                      <option key={domain.id} value={domain.name}>{domain.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddUser(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Add User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Domain Modal */}
      {showAddDomain && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-6">Add Domain</h2>
            <form onSubmit={handleAddDomain}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Domain Name</label>
                <input
                  type="text"
                  value={newDomain.name}
                  onChange={(e) => setNewDomain({...newDomain, name: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
                <div className="grid grid-cols-4 gap-2">
                  {colors.map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewDomain({...newDomain, color})}
                      className={`h-10 rounded-lg ${color} ${
                        newDomain.color === color ? 'ring-4 ring-gray-300' : ''
                      }`}
                    />
                  ))}
                </div>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddDomain(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  Add Domain
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;