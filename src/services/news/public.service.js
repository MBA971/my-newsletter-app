const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002';

// Helper function to get headers with authorization token
const getAuthHeaders = () => {
  const token = localStorage.getItem('accessToken');
  return token ? {
    'Authorization': `Bearer ${token}`
  } : {};
};

// Fetch all public news
export const fetchPublicNews = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/news`, {
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching public news:', error);
    throw error;
  }
};