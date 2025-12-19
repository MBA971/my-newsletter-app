const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002';

// Login user
export const login = async (credentials) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(credentials)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error logging in:', error);
    throw error;
  }
};

// Logout user
export const logout = async () => {
  try {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      // No token to logout with, but that's fine
      return { message: 'Already logged out' };
    }
    
    const response = await fetch(`${API_BASE_URL}/api/auth/logout`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    // Even if the logout fails on the server, we still want to clear local storage
    localStorage.removeItem('accessToken');
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error logging out:', error);
    // Still clear local storage even if there's an error
    localStorage.removeItem('accessToken');
    throw error;
  }
};

// Get current user from token
export const getCurrentUser = () => {
  const token = localStorage.getItem('accessToken');
  if (!token) {
    return null;
  }
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (payload.exp * 1000 > Date.now()) {
      return {
        id: payload.userId,
        email: payload.email,
        username: payload.username,
        role: payload.role,
        domain: payload.domain
      };
    } else {
      // Token expired, remove it
      localStorage.removeItem('accessToken');
      return null;
    }
  } catch (error) {
    console.error('Error parsing token:', error);
    localStorage.removeItem('accessToken');
    return null;
  }
};