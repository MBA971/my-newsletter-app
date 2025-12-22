// Use relative path for proxy, or full URL as fallback
const API_URL = '';

// Helper to get headers with auth token
const getHeaders = (withAuth = false) => {
    const headers = {
        'Content-Type': 'application/json',
    };

    if (withAuth) {
        const token = localStorage.getItem('accessToken');
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
    }

    return headers;
};

// Subscribers API
export const subscribers = {
    getAll: async () => {
        const response = await fetch(`${API_URL}/api/subscribers`, {
            headers: getHeaders(true),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            if (errorData.error) {
                throw new Error(errorData.error);
            }
            throw new Error('Failed to fetch subscribers');
        }

        return response.json();
    }
};