// Use relative path for proxy, or full URL as fallback
const API_URL = '/api';

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