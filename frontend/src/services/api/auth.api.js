// Handle Docker vs Localhost resolution
let apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3002';

// If running in browser and URL contains Docker service names, replace with localhost
// This fixes the issue where docker-compose sets VITE_API_URL=http://backend:3002 but browser needs localhost:3002
if (typeof window !== 'undefined') {
    // Replace various Docker service names with localhost
    if (apiUrl.includes('://backend')) {
        apiUrl = apiUrl.replace('://backend:', '://localhost:').replace('://backend', '://localhost:3002');
    } else if (apiUrl.includes('://newsletter_backend')) {
        apiUrl = apiUrl.replace('://newsletter_backend:', '://localhost:').replace('://newsletter_backend', '://localhost:3002');
    } else if (apiUrl.includes('://newsletter-backend')) {
        apiUrl = apiUrl.replace('://newsletter-backend:', '://localhost:').replace('://newsletter-backend', '://localhost:3002');
    } else if (apiUrl.includes('://my-newsletter-app-backend')) {
        apiUrl = apiUrl.replace('://my-newsletter-app-backend:', '://localhost:').replace('://my-newsletter-app-backend', '://localhost:3002');
    }
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

// Auth API
export const auth = {
    login: async (email, password) => {
        const response = await fetch(`${API_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.error || 'Login failed');
        }

        return response.json();
    },

    logout: async () => {
        try {
            const token = localStorage.getItem('accessToken');
            if (token) {
                await fetch(`${API_URL}/api/auth/logout`, {
                    method: 'POST',
                    headers: getHeaders(true),
                });
            }
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            localStorage.removeItem('accessToken');
        }
    }
};