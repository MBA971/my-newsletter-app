const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002';

// Helper function to get headers with authorization token
const getAuthHeaders = () => {
  const token = localStorage.getItem('accessToken');
  return token ? {
    'Authorization': `Bearer ${token}`
  } : {};
};

// Toggle archive status of a news article
export const toggleArchiveNews = async (id) => {
  try {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      throw new Error('No authentication token found');
    }
    
    const response = await fetch(`${API_BASE_URL}/api/news/${id}/toggle-archive`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error toggling archive status:', error);
    throw error;
  }
};

// Validate a news article
export const validateNews = async (id) => {
  try {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      throw new Error('No authentication token found');
    }
    
    const response = await fetch(`${API_BASE_URL}/api/news/${id}/validate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error validating news:', error);
    throw error;
  }
};

// Like a news article
export const likeNews = async (id) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/news/${id}/like`, {
      method: 'POST'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error liking news:', error);
    throw error;
  }
};