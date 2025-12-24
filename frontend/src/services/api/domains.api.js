// For local development with Vite dev server, use relative paths to leverage Vite proxy
// For Docker containers or production, use the configured API URL
let apiUrl = '';

// Only use absolute URL if not in localhost development environment
if (import.meta.env.VITE_API_URL && !(typeof window !== 'undefined' && window.location.hostname === 'localhost')) {
    apiUrl = import.meta.env.VITE_API_URL;
    
    // If running in Docker container, replace service names with localhost
    if (typeof window !== 'undefined') { // Only run in browser
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

// Domains API
export const domains = {
    getAll: async () => {
        const response = await fetch(`${API_URL}/api/domains`, {
            headers: getHeaders(!!localStorage.getItem('accessToken'))
        });
        if (!response.ok) throw new Error('Failed to fetch domains');
        return response.json();
    },

    create: async (domainData) => {
        const response = await fetch(`${API_URL}/api/domains`, {
            method: 'POST',
            headers: getHeaders(true),
            body: JSON.stringify(domainData),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            if (errorData.details) {
                // Extract validation error messages
                const messages = errorData.details.map(detail => detail.message || detail.msg).join(', ');
                throw new Error(messages || 'Failed to create domain');
            }
            throw new Error('Failed to create domain');
        }

        return response.json();
    },

    update: async (id, domainData) => {
        const response = await fetch(`${API_URL}/api/domains/${id}`, {
            method: 'PUT',
            headers: getHeaders(true),
            body: JSON.stringify(domainData),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            if (errorData.details) {
                // Extract validation error messages
                const messages = errorData.details.map(detail => detail.message || detail.msg).join(', ');
                throw new Error(messages || 'Failed to update domain');
            }
            throw new Error('Failed to update domain');
        }

        return response.json();
    },

    delete: async (id) => {
        const response = await fetch(`${API_URL}/api/domains/${id}`, {
            method: 'DELETE',
            headers: getHeaders(true),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            if (errorData.error) {
                throw new Error(errorData.error);
            }
            throw new Error('Failed to delete domain');
        }

        return response.json();
    }
};