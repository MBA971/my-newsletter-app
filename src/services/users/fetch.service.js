const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002';

// Helper function to get headers with authorization token
const getAuthHeaders = () => {
  const token = localStorage.getItem('accessToken');
  return token ? {
    'Authorization': `Bearer ${token}`
  } : {};
};

// Fetch all users (admin only)
export const fetchUsers = async () => {
  try {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      throw new Error('No authentication token found');
    }
    
    const response = await fetch(`${API_BASE_URL}/api/users`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('[DEBUG] fetchUsers response:', JSON.stringify(data, null, 2));
    return data;
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
};

// Fetch users by domain (domain admin only)
export const fetchUsersByDomain = async () => {
  try {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      throw new Error('No authentication token found');
    }
    
    const response = await fetch(`${API_BASE_URL}/api/users/by-domain`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('[DEBUG] fetchUsersByDomain response:', data);
    return data;
  } catch (error) {
    console.error('Error fetching users by domain:', error);
    throw error;
  }
};

// Fetch subscribers (admin only)
export const fetchSubscribers = async () => {
  try {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      throw new Error('No authentication token found');
    }
    
    const response = await fetch(`${API_BASE_URL}/api/subscribers`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching subscribers:', error);
    throw error;
  }
};