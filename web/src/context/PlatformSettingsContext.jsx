import React, { createContext, useState, useContext, useEffect } from 'react';

const PlatformSettingsContext = createContext();

export const PlatformSettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState({
    platformCommission: 15,
    cancellationWindow: 24,
    instapayEnabled: true,
    visaEnabled: true,
  });

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('platform_settings');
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings));
      } catch (e) {
        console.error('Failed to load settings:', e);
      }
    }
  }, []);

  const saveSettings = (newSettings) => {
    setSettings(newSettings);
    localStorage.setItem('platform_settings', JSON.stringify(newSettings));
  };

  const updateSetting = (key, value) => {
    const updated = { ...settings, [key]: value };
    saveSettings(updated);
  };

  const calculateEarnings = (baseAmount) => {
    const commission = (baseAmount * settings.platformCommission) / 100;
    return baseAmount - commission;
  };

  return (
    <PlatformSettingsContext.Provider value={{ settings, saveSettings, updateSetting, calculateEarnings }}>
      {children}
    </PlatformSettingsContext.Provider>
  );
};

export const usePlatformSettings = () => {
  const context = useContext(PlatformSettingsContext);
  if (!context) {
    throw new Error('usePlatformSettings must be used within PlatformSettingsProvider');
  }
  return context;
};
