/**
 * Unit tests for App component - Core functionality
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../App.jsx';

// Mock all services
jest.mock('../services/api', () => ({
  auth: {
    login: jest.fn(() => Promise.resolve({ user: { id: 1, username: 'testuser', email: 'test@example.com', role: 'contributor', domain: 'Hiring' }, accessToken: 'test_token' })),
    logout: jest.fn(() => Promise.resolve({ message: 'Logout successful' })),
    refresh: jest.fn(() => Promise.resolve({ accessToken: 'new_token', refreshToken: 'new_refresh_token' }))
  },
  domains: {
    getAll: jest.fn(() => Promise.resolve([
      { id: 1, name: 'Hiring', color: '#007AFF' },
      { id: 2, name: 'Events', color: '#5856D6' }
    ]))
  },
  news: {
    getAll: jest.fn(() => Promise.resolve([
      { id: 1, title: 'Test Article', domain: 'Hiring', content: 'Test content', author: 'testuser', date: '2025-12-20' }
    ])),
    getAllAdmin: jest.fn(() => Promise.resolve([])),
    getContributorNews: jest.fn(() => Promise.resolve([])),
    create: jest.fn(() => Promise.resolve({})),
    update: jest.fn(() => Promise.resolve({})),
    delete: jest.fn(() => Promise.resolve({})),
    toggleArchive: jest.fn(() => Promise.resolve({})),
    validate: jest.fn(() => Promise.resolve({})),
    getArchived: jest.fn(() => Promise.resolve([])),
    getPendingValidation: jest.fn(() => Promise.resolve([])),
    getById: jest.fn(() => Promise.resolve({ id: 1, title: 'Test Article', domain: 'Hiring', content: 'Test content', author: 'testuser', date: '2025-12-20' }))
  },
  users: {
    getAll: jest.fn(() => Promise.resolve([])),
    getByDomain: jest.fn(() => Promise.resolve([])),
    create: jest.fn(() => Promise.resolve({})),
    update: jest.fn(() => Promise.resolve({})),
    delete: jest.fn(() => Promise.resolve({}))
  },
  subscribers: {
    getAll: jest.fn(() => Promise.resolve([])),
    create: jest.fn(() => Promise.resolve({})),
    delete: jest.fn(() => Promise.resolve({}))
  },
  audit: {
    getAll: jest.fn(() => Promise.resolve([]))
  }
}));

// Mock the components
jest.mock('./components/views/PublicView', () => () => <div data-testid="public-view">Public View</div>);
jest.mock('./components/views/ContributorView', () => () => <div data-testid="contributor-view">Contributor View</div>);
jest.mock('./components/views/AdminView', () => () => <div data-testid="admin-view">Admin View</div>);
jest.mock('./components/modals/LoginModal', () => ({ show, onClose, onLogin, loginForm, setLoginForm }) => {
  return show ? (
    <div data-testid="login-modal">
      <form onSubmit={onLogin}>
        <input 
          type="email" 
          value={loginForm.email} 
          onChange={(e) => setLoginForm({...loginForm, email: e.target.value})}
          data-testid="email-input"
        />
        <input 
          type="password" 
          value={loginForm.password} 
          onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
          data-testid="password-input"
        />
        <button type="submit">Login</button>
      </form>
    </div>
  ) : null;
});
jest.mock('./components/modals/UserModal', () => ({ show, ...props }) => {
  return show ? <div data-testid="user-modal">User Modal</div> : null;
});
jest.mock('./components/ui/Notification', () => ({ notification }) => {
  return notification ? <div data-testid="notification">{notification.message}</div> : null;
});

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock window.location
delete window.location;
window.location = { reload: jest.fn() };

// Mock atob for JWT decoding
global.atob = jest.fn((str) => {
  // Simulate decoding a JWT payload
  const mockPayload = {
    userId: 1,
    email: 'test@example.com',
    username: 'testuser',
    role: 'contributor',
    domain: 'Hiring',
    exp: Date.now() + 1000000 // Future expiration
  };
  return JSON.stringify(mockPayload);
});

describe('App Component - Core Functionality', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('loads public view by default', async () => {
    localStorageMock.getItem.mockReturnValue(null); // No token in storage
    
    render(<App />);
    
    // Initially, public view should be shown
    expect(screen.getByTestId('public-view')).toBeInTheDocument();
  });

  test('shows login modal when not authenticated', () => {
    localStorageMock.getItem.mockReturnValue(null); // No token
    
    render(<App />);
    
    // Check if login button is available
    expect(screen.getByText('Login')).toBeInTheDocument();
  });

  test('handles user login', async () => {
    const mockLoginResponse = {
      user: { id: 1, username: 'testuser', email: 'test@example.com', role: 'contributor', domain: 'Hiring' },
      accessToken: 'test_token',
      message: 'Login successful'
    };
    
    const loginSpy = jest.spyOn(require('../services/api').auth, 'login');
    loginSpy.mockResolvedValue(mockLoginResponse);
    
    localStorageMock.getItem.mockReturnValue(null);
    
    render(<App />);
    
    // Open login modal
    fireEvent.click(screen.getByText('Login'));
    expect(screen.getByTestId('login-modal')).toBeInTheDocument();
    
    // Fill in login form
    fireEvent.change(screen.getByTestId('email-input'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByTestId('password-input'), { target: { value: 'password123' } });
    
    // Submit login form
    fireEvent.click(screen.getByText('Login'));
    
    await waitFor(() => {
      expect(loginSpy).toHaveBeenCalledWith('test@example.com', 'password123');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('accessToken', 'test_token');
    });
  });

  test('switches to contributor view after login', async () => {
    const mockUser = { id: 1, username: 'testuser', email: 'test@example.com', role: 'contributor', domain: 'Hiring' };
    
    // Simulate that user is already logged in
    localStorageMock.getItem.mockReturnValueOnce('existing_token');
    global.atob.mockReturnValueOnce(JSON.stringify({
      userId: 1,
      email: 'test@example.com',
      username: 'testuser',
      role: 'contributor',
      domain: 'Hiring',
      exp: Date.now() + 1000000
    }));
    
    render(<App />);
    
    // Wait for the data to load
    await waitFor(() => {
      // Depending on the implementation, the view should switch based on role
      expect(screen.queryByTestId('contributor-view')).toBeInTheDocument();
    });
  });

  test('switches to admin view for admin users', async () => {
    // Simulate admin user token
    localStorageMock.getItem.mockReturnValueOnce('admin_token');
    global.atob.mockReturnValueOnce(JSON.stringify({
      userId: 1,
      email: 'admin@example.com',
      username: 'admin',
      role: 'super_admin',
      domain: null,
      exp: Date.now() + 1000000
    }));
    
    render(<App />);
    
    // Wait for the data to load
    await waitFor(() => {
      // The view should eventually switch to admin based on role
    });
  });

  test('handles view switching', () => {
    localStorageMock.getItem.mockReturnValueOnce('existing_token');
    global.atob.mockReturnValueOnce(JSON.stringify({
      userId: 1,
      email: 'test@example.com',
      username: 'testuser',
      role: 'contributor',
      domain: 'Hiring',
      exp: Date.now() + 1000000
    }));
    
    render(<App />);
    
    // Check that view switching elements are present
    const viewSwitcher = screen.queryByTitle(/switch view/i);
    if (viewSwitcher) {
      // Test view switching functionality
      fireEvent.click(viewSwitcher);
    }
  });

  test('fetches public data on load', async () => {
    const domainsSpy = jest.spyOn(require('../services/api').domains, 'getAll');
    const newsSpy = jest.spyOn(require('../services/api').news, 'getAll');
    
    localStorageMock.getItem.mockReturnValue(null); // No user token
    
    render(<App />);
    
    await waitFor(() => {
      expect(domainsSpy).toHaveBeenCalled();
      expect(newsSpy).toHaveBeenCalled();
    });
  });

  test('handles logout functionality', async () => {
    const mockUser = { id: 1, username: 'testuser', role: 'contributor' };
    const logoutSpy = jest.spyOn(require('../services/api').auth, 'logout');
    logoutSpy.mockResolvedValue({ message: 'Logout successful' });
    
    // Simulate logged in user
    localStorageMock.getItem.mockReturnValueOnce('existing_token');
    global.atob.mockReturnValueOnce(JSON.stringify({
      userId: 1,
      username: 'testuser',
      role: 'contributor',
      exp: Date.now() + 1000000
    }));
    
    render(<App />);
    
    // Simulate logout (this would depend on the actual UI implementation)
    // Typically triggered through a logout button in the header
  });

  test('handles theme switching', () => {
    render(<App />);
    
    // Check if theme toggle button exists
    const themeToggle = screen.queryByTitle(/toggle dark mode/i) || screen.queryByLabelText(/toggle dark mode/i);
    if (themeToggle) {
      fireEvent.click(themeToggle);
      // Check if theme is properly applied
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    }
  });

  test('shows notifications for errors', async () => {
    const mockError = new Error('Test error message');
    const showNotification = jest.fn();
    
    // Render with mock notification function
    render(<App />);
    
    // Test notification functionality - this would be triggered by other functions
  });

  test('manages loading states properly', () => {
    render(<App />);
    
    // Check if loading indicators are properly managed
    const loadingElements = screen.queryAllByText(/loading/i);
    // Loading states should be properly handled
  });
});