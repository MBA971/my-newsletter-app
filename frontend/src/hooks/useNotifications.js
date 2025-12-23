import { useState, useCallback } from 'react';

export const useNotifications = () => {
  const [notification, setNotification] = useState(null);

  const showNotification = useCallback((message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 8000);
  }, []);

  return { notification, showNotification };
};
