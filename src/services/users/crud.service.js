const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002';

// Helper function to get headers with authorization token
const getAuthHeaders = () => {
  const token = localStorage.getItem('accessToken');
  return token ? {
    'Authorization': `Bearer ${token}`
  } : {};
};

// Create a new user (admin only)
export const createUser = async (userData) => {
  try {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      throw new Error('No authentication token found');
    }
    
    const response = await fetch(`${API_BASE_URL}/api/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(userData)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

// Update a user (admin only)
export const updateUser = async (id, userData) => {
  try {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      throw new Error('No authentication token found');
    }
    
    const response = await fetch(`${API_BASE_URL}/api/users/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(userData)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
};

// Delete a user (admin only)
export const deleteUser = async (id) => {
  try {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      throw new Error('No authentication token found');
    }
    
    const response = await fetch(`${API_BASE_URL}/api/users/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
};