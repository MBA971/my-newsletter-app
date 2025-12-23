import { useState, useEffect, useCallback } from 'react';
import { auth } from '../services/api';

export const useAuth = (showNotification) => {
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.exp * 1000 > Date.now()) {
          setCurrentUser({
            id: payload.userId,
            email: payload.email,
            username: payload.username,
            role: payload.role,
            domain_id: payload.domain_id,
            domain: payload.domain_name
          });
        } else {
          localStorage.removeItem('accessToken');
        }
      } catch (error) {
        localStorage.removeItem('accessToken');
      }
    }
  }, []);

  const handleLogin = async (loginData) => {
    if (!loginData || !loginData.email || !loginData.password) {
      showNotification('Please provide both email and password', 'error');
      return null;
    }

    try {
      const data = await auth.login(loginData.email, loginData.password);
      localStorage.setItem('accessToken', data.accessToken);
      const user = { ...data.user };
      setCurrentUser(user);
      showNotification(`Welcome back, ${data.user.username}!`, 'success');
      return user;
    } catch (error) {
      showNotification(error.message || 'An unexpected error occurred during login. Please try again.', 'error');
      return null;
    }
  };

  const handleLogout = useCallback(async () => {
    await auth.logout();
    setCurrentUser(null);
    showNotification('Logged out successfully', 'info');
  }, [showNotification]);

  return { currentUser, setCurrentUser, handleLogin, handleLogout };
};
