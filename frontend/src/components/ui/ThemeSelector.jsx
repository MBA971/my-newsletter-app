import React, { useEffect } from 'react';
import { Paintbrush } from 'lucide-react';
import { themes, applyTheme, setThemePreference } from '../../themes/modernThemes';

const ThemeSelector = ({ currentTheme, onThemeChange }) => {
  useEffect(() => {
    // Apply the current theme when component mounts or changes
    applyTheme(currentTheme);
  }, [currentTheme]);

  const handleThemeChange = (themeName) => {
    setThemePreference(themeName);
    onThemeChange(themeName);
  };

  return (
    <div className="theme-selector">
      <div className="flex items-center gap-2 mb-3">
        <Paintbrush size={16} />
        <span className="text-sm font-medium">Design Theme</span>
      </div>
      
      <div className="flex gap-2">
        {Object.entries(themes).map(([themeKey, theme]) => (
          <button
            key={themeKey}
            onClick={() => handleThemeChange(themeKey)}
            className={`theme-option ${
              currentTheme === themeKey ? 'theme-option-active' : ''
            }`}
            title={theme.name}
          >
            {theme.name}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ThemeSelector;