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
                const messages = errorData.details.map(detail => detail.message || detail.msg).join(', ');
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
                const messages = errorData.details.map(detail => detail.message || detail.msg).join(', ');
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