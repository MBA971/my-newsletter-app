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
                const messages = errorData.details.map(detail => detail.msg).join(', ');
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
                const messages = errorData.details.map(detail => detail.msg).join(', ');
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

// News API
export const news = {
    getAll: async () => {
        const response = await fetch(`${API_URL}/api/news`, {
            headers: getHeaders(!!localStorage.getItem('accessToken'))
        });
        if (!response.ok) throw new Error('Failed to fetch news');
        return response.json();
    },

    getById: async (id) => {
        const response = await fetch(`${API_URL}/api/news/${id}`, {
            headers: getHeaders(!!localStorage.getItem('accessToken'))
        });
        if (!response.ok) throw new Error('Failed to fetch news');
        return response.json();
    },

    create: async (newsData) => {
        const response = await fetch(`${API_URL}/api/news`, {
            method: 'POST',
            headers: getHeaders(true),
            body: JSON.stringify(newsData),
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            if (errorData.details) {
                // Extract validation error messages
                const messages = errorData.details.map(detail => detail.msg).join(', ');
                throw new Error(messages || 'Failed to create news');
            }
            throw new Error('Failed to create news');
        }
        
        return response.json();
    },

    update: async (id, newsData) => {
        const response = await fetch(`${API_URL}/api/news/${id}`, {
            method: 'PUT',
            headers: getHeaders(true),
            body: JSON.stringify(newsData),
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            if (errorData.details) {
                // Extract validation error messages
                const messages = errorData.details.map(detail => detail.msg).join(', ');
                throw new Error(messages || 'Failed to update news');
            }
            throw new Error('Failed to update news');
        }
        
        return response.json();
    },

    delete: async (id) => {
        const response = await fetch(`${API_URL}/api/news/${id}`, {
            method: 'DELETE',
            headers: getHeaders(true),
        });
        if (!response.ok) throw new Error('Failed to delete news');
        return response.json();
    }
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
        const response = await fetch(`${API_URL}/api/users/${id}`, {
            method: 'PUT',
            headers: getHeaders(true),
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

// Audit API
export const audit = {
    getAll: async () => {
        const response = await fetch(`${API_URL}/api/audit`, {
            headers: getHeaders(true),
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            if (errorData.error) {
                throw new Error(errorData.error);
            }
            throw new Error('Failed to fetch audit logs');
        }
        
        return response.json();
    }
};
