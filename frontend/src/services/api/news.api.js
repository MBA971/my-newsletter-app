// Handle Docker vs Localhost resolution
let apiUrl = import.meta.env.VITE_API_URL || '';

// If running in browser and URL contains Docker service names, replace with localhost
// This ensures consistency between local dev and production
if (typeof window !== 'undefined' && apiUrl) {
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

// News API
export const news = {
    getAll: async () => {
        const response = await fetch(`${API_URL}/api/news`, {
            headers: getHeaders(!!localStorage.getItem('accessToken'))
        });
        if (!response.ok) throw new Error('Failed to fetch news');
        return response.json();
    },

    getAllAdmin: async () => {
        const response = await fetch(`${API_URL}/api/news/admin`, {
            headers: getHeaders(true)
        });
        if (!response.ok) {
            const errorText = await response.text();
            console.error('[DEBUG] getAllAdmin failed. Status:', response.status, 'Body:', errorText);
            throw new Error(`Failed to fetch admin news: ${response.status} ${errorText}`);
        }
        return response.json();
    },

    getContributorNews: async () => {
        const response = await fetch(`${API_URL}/api/news/contributor`, {
            headers: getHeaders(true)
        });
        if (!response.ok) throw new Error('Failed to fetch contributor news');
        return response.json();
    },

    getById: async (id) => {
        const response = await fetch(`${API_URL}/api/news/${id}`, {
            headers: getHeaders(!!localStorage.getItem('accessToken'))
        });
        if (!response.ok) throw new Error('Failed to fetch news');
        return response.json();
    },

    getArchived: async () => {
        const response = await fetch(`${API_URL}/api/news/archived`, {
            headers: getHeaders(true)
        });
        if (!response.ok) throw new Error('Failed to fetch archived news');
        return response.json();
    },

    getPendingValidation: async () => {
        const response = await fetch(`${API_URL}/api/news/pending-validation`, {
            headers: getHeaders(true)
        });
        if (!response.ok) throw new Error('Failed to fetch pending validation news');
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
                const messages = errorData.details.map(detail => detail.message || detail.msg).join(', ');
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
            const errorText = await response.text();

            let errorData;
            try {
                errorData = JSON.parse(errorText);
            } catch (e) {
                errorData = { message: errorText || 'Failed to update news' };
            }

            if (errorData.details) {
                // Extract validation error messages
                const messages = errorData.details.map(detail => detail.message || detail.msg).join(', ');
                throw new Error(messages || 'Failed to update news');
            }
            throw new Error(errorData.message || errorData.error || 'Failed to update news');
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
    },

    toggleArchive: async (id) => {
        const response = await fetch(`${API_URL}/api/news/${id}/toggle-archive`, {
            method: 'POST',
            headers: getHeaders(true),
        });
        if (!response.ok) throw new Error('Failed to toggle archive status');
        return response.json();
    },

    archive: async (id) => {
        // Use the toggle-archive endpoint since separate archive/unarchive endpoints don't exist
        const response = await fetch(`${API_URL}/api/news/${id}/toggle-archive`, {
            method: 'POST',
            headers: getHeaders(true),
        });
        if (!response.ok) throw new Error('Failed to archive news');
        const result = await response.json();
        // If the item was already archived, we might need to handle that case
        return result;
    },

    unarchive: async (id) => {
        // Use the toggle-archive endpoint since separate archive/unarchive endpoints don't exist
        const response = await fetch(`${API_URL}/api/news/${id}/toggle-archive`, {
            method: 'POST',
            headers: getHeaders(true),
        });
        if (!response.ok) throw new Error('Failed to unarchive news');
        const result = await response.json();
        // If the item was already unarchived, we might need to handle that case
        return result;
    },

    validate: async (id) => {
        const response = await fetch(`${API_URL}/api/news/${id}/validate`, {
            method: 'POST',
            headers: getHeaders(true),
        });
        if (!response.ok) throw new Error('Failed to validate news');
        return response.json();
    }
};