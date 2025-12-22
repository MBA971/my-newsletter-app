const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002';

// Helper function to get headers with authorization token
const getAuthHeaders = () => {
  const token = localStorage.getItem('accessToken');
  return token ? {
    'Authorization': `Bearer ${token}`
  } : {};
};

// Fetch all domains
export const fetchDomains = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/domains`, {
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('[DEBUG] fetchDomains response:', JSON.stringify(data, null, 2));
    return data;
  } catch (error) {
    console.error('Error fetching domains:', error);
    throw error;
  }
};