// Handle Docker vs Localhost resolution
let apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3002';

// If running in browser and URL contains '://backend' (docker service name), replace with localhost:3002
// This fixes the issue where docker-compose sets VITE_API_URL=http://backend:3002 but browser needs localhost:3002
if (typeof window !== 'undefined' && apiUrl.includes('://backend')) {
    apiUrl = apiUrl.replace('://backend:', '://localhost:').replace('://backend', '://localhost:3002');
}

const API_URL = apiUrl;

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