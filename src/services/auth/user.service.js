// Get current user from token
export const getCurrentUser = () => {
  const token = localStorage.getItem('accessToken');
  if (!token) {
    return null;
  }
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (payload.exp * 1000 > Date.now()) {
      return {
        id: payload.userId,
        email: payload.email,
        username: payload.username,
        role: payload.role,
        domain: payload.domain
      };
    } else {
      // Token expired, remove it
      localStorage.removeItem('accessToken');
      return null;
    }
  } catch (error) {
    console.error('Error parsing token:', error);
    localStorage.removeItem('accessToken');
    return null;
  }
};