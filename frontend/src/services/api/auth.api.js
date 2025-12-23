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