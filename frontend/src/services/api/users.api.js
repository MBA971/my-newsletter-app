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

// Users API
export const users = {
    getAll: async () => {
        const response = await fetch(`${API_URL}/api/users`, {
            headers: getHeaders(true),
        });
        if (!response.ok) throw new Error('Failed to fetch users');
        return response.json();
    },

    getByDomain: async () => {
        const response = await fetch(`${API_URL}/api/users/by-domain`, {
            headers: getHeaders(true),
        });
        if (!response.ok) throw new Error('Failed to fetch users by domain');
        return response.json();
    },

    create: async (userData) => {
        const response = await fetch(`${API_URL}/api/users`, {
            method: 'POST',
            headers: getHeaders(true),
            body: JSON.stringify(userData),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            if (errorData.details) {
                // Extract validation error messages
                const messages = errorData.details.map(detail => detail.msg).join(', ');
                throw new Error(messages || 'Failed to create user');
            }
            throw new Error('Failed to create user');
        }

        return response.json();
    },

    update: async (id, userData) => {
        const headers = getHeaders(true);
        console.log('[DEBUG] Sending update request with headers:', headers);
        console.log('[DEBUG] Sending update request with body:', JSON.stringify(userData));
        
        const response = await fetch(`${API_URL}/api/users/${id}`, {
            method: 'PUT',
            headers: headers,
            body: JSON.stringify(userData),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            if (errorData.details) {
                // Extract validation error messages
                const messages = errorData.details.map(detail => detail.msg).join(', ');
                throw new Error(messages || 'Failed to update user');
            }
            throw new Error('Failed to update user');
        }

        return response.json();
    },

    delete: async (id) => {
        const response = await fetch(`${API_URL}/api/users/${id}`, {
            method: 'DELETE',
            headers: getHeaders(true),
        });
        if (!response.ok) throw new Error('Failed to delete user');
        return response.json();
    }
};