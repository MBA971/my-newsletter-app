/**
 * Modern Design Themes for User Profile
 */

export const themes = {
  // macOS-style theme
  macos: {
    name: 'macOS',
    colors: {
      primary: '#007AFF',
      secondary: '#5856D6',
      background: '#F5F5F7',
      surface: '#FFFFFF',
      text: '#1C1C1E',
      textSecondary: '#86868B',
      border: '#D1D1D6',
      accent: '#FF2D55',
      success: '#34C759',
      warning: '#FF9500',
      error: '#FF3B30',
      overlay: 'rgba(0, 0, 0, 0.2)'
    },
    typography: {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      fontWeight: {
        regular: 400,
        medium: 500,
        semibold: 600,
        bold: 700
      }
    },
    shadows: {
      light: '0 4px 6px rgba(0, 0, 0, 0.05)',
      medium: '0 10px 15px rgba(0, 0, 0, 0.1)',
      heavy: '0 20px 25px rgba(0, 0, 0, 0.15)'
    },
    borderRadius: {
      small: '6px',
      medium: '8px',
      large: '12px',
      full: '9999px'
    }
  },
  
  // Windows 11-style theme
  windows: {
    name: 'Windows',
    colors: {
      primary: '#0078D4',
      secondary: '#804BFF',
      background: '#F3F3F3',
      surface: '#FFFFFF',
      text: '#201F1E',
      textSecondary: '#616161',
      border: '#E1E1E1',
      accent: '#D83B01',
      success: '#107C10',
      warning: '#F2C811',
      error: '#A4262C',
      overlay: 'rgba(0, 0, 0, 0.3)'
    },
    typography: {
      fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
      fontWeight: {
        regular: 400,
        medium: 500,
        semibold: 600,
        bold: 700
      }
    },
    shadows: {
      light: '0 2px 4px rgba(0, 0, 0, 0.1)',
      medium: '0 4px 8px rgba(0, 0, 0, 0.15)',
      heavy: '0 8px 16px rgba(0, 0, 0, 0.2)'
    },
    borderRadius: {
      small: '4px',
      medium: '6px',
      large: '8px',
      full: '4px'
    }
  },
  
  // Dark theme
  dark: {
    name: 'Dark Mode',
    colors: {
      primary: '#0A84FF',
      secondary: '#5E5CE6',
      background: '#1C1C1E',
      surface: '#2C2C2E',
      text: '#FFFFFF',
      textSecondary: '#98989D',
      border: '#48484A',
      accent: '#FF453A',
      success: '#32D74B',
      warning: '#FFD60A',
      error: '#FF453A',
      overlay: 'rgba(255, 255, 255, 0.1)'
    },
    typography: {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      fontWeight: {
        regular: 400,
        medium: 500,
        semibold: 600,
        bold: 700
      }
    },
    shadows: {
      light: '0 4px 6px rgba(0, 0, 0, 0.3)',
      medium: '0 10px 15px rgba(0, 0, 0, 0.4)',
      heavy: '0 20px 25px rgba(0, 0, 0, 0.5)'
    },
    borderRadius: {
      small: '6px',
      medium: '8px',
      large: '12px',
      full: '9999px'
    }
  },
  
  // Minimal theme
  minimal: {
    name: 'Minimal',
    colors: {
      primary: '#2C2C2E',
      secondary: '#86868B',
      background: '#FAFAFA',
      surface: '#FFFFFF',
      text: '#1C1C1E',
      textSecondary: '#86868B',
      border: '#D1D1D6',
      accent: '#000000',
      success: '#34C759',
      warning: '#FF9500',
      error: '#FF3B30',
      overlay: 'rgba(0, 0, 0, 0.1)'
    },
    typography: {
      fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif',
      fontWeight: {
        regular: 400,
        medium: 500,
        semibold: 600,
        bold: 700
      }
    },
    shadows: {
      light: '0 1px 2px rgba(0, 0, 0, 0.05)',
      medium: '0 2px 4px rgba(0, 0, 0, 0.1)',
      heavy: '0 4px 8px rgba(0, 0, 0, 0.15)'
    },
    borderRadius: {
      small: '4px',
      medium: '6px',
      large: '8px',
      full: '9999px'
    }
  }
};
// Theme provider component
export const applyTheme = (themeName) => {
  const theme = themes[themeName];
  if (!theme) return;

  const root = document.documentElement;
  
  // Apply color variables
  Object.entries(theme.colors).forEach(([key, value]) => {
    root.style.setProperty(`--theme-${key}`, value);
  });
  
  // Apply typography variables
  root.style.setProperty('--theme-font-family', theme.typography.fontFamily);
  root.style.setProperty('--theme-font-weight-regular', theme.typography.fontWeight.regular);
  root.style.setProperty('--theme-font-weight-medium', theme.typography.fontWeight.medium);
  root.style.setProperty('--theme-font-weight-semibold', theme.typography.fontWeight.semibold);
  root.style.setProperty('--theme-font-weight-bold', theme.typography.fontWeight.bold);
  
  // Apply shadow variables
  Object.entries(theme.shadows).forEach(([key, value]) => {
    root.style.setProperty(`--theme-shadow-${key}`, value);
  });
  
  // Apply border radius variables
  Object.entries(theme.borderRadius).forEach(([key, value]) => {
    root.style.setProperty(`--theme-radius-${key}`, value);
  });
};

// Get current theme
export const getCurrentTheme = () => {
  return localStorage.getItem('userTheme') || 'macos';
};

// Set theme preference
export const setThemePreference = (themeName) => {
  localStorage.setItem('userTheme', themeName);
  applyTheme(themeName);
};