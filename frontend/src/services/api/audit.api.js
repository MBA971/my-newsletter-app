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