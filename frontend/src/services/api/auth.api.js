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
        console.log('🔍 FRONTEND LOGIN ATTEMPT:', { email, timestamp: new Date().toISOString(), apiUrl: API_URL });
        
        const response = await fetch(`${API_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });
        
        console.log('📡 LOGIN RESPONSE STATUS:', response.status);

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            console.error('❌ LOGIN FAILED:', error);
            throw new Error(error.error || 'Login failed');
        }
        
        console.log('✅ LOGIN RESPONSE SUCCESSFUL');

        return response.json();
    },

    logout: async () => {
        console.log('🚪 FRONTEND LOGOUT ATTEMPT:', { timestamp: new Date().toISOString(), hasToken: !!localStorage.getItem('accessToken') });
        
        try {
            const token = localStorage.getItem('accessToken');
            if (token) {
                console.log('📡 SENDING LOGOUT REQUEST TO BACKEND');
                
                await fetch(`${API_URL}/api/auth/logout`, {
                    method: 'POST',
                    headers: getHeaders(true),
                });
            }
        } catch (error) {
            console.error('❌ LOGOUT ERROR:', error);
        } finally {
            localStorage.removeItem('accessToken');
            console.log('✅ LOGOUT COMPLETED - TOKEN REMOVED FROM LOCAL STORAGE');
        }
    }
};