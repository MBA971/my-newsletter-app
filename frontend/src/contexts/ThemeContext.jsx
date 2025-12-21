import React, { createContext, useContext, useState, useEffect } from 'react';
import { applyTheme, getCurrentTheme } from '../themes/modernThemes.js';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState(getCurrentTheme);

  useEffect(() => {
    // Apply the current theme when it changes
    applyTheme(currentTheme);
    
    // Also update the body class
    document.body.className = `theme-${currentTheme}`;
  }, [currentTheme]);

  const setTheme = (themeName) => {
    setCurrentTheme(themeName);
    localStorage.setItem('userTheme', themeName);
  };

  return (
    <ThemeContext.Provider value={{ currentTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};