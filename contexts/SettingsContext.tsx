import React, { createContext, useContext, useState, useEffect } from 'react';
import { LocalStorageService, UserSettings } from '@/services/LocalStorageService';
import { useAuth } from '@/contexts/AuthContext';

interface SettingsContextData {
  settings: UserSettings;
  loading: boolean;
  error: string | null;
  updateSettings: (updates: Partial<UserSettings>) => Promise<void>;
  refreshSettings: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextData>({} as SettingsContextData);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<UserSettings>({
    notifications: true,
    reminderTime: '09:00',
    dailyGoal: 2,
    weeklyGoal: 14,
    theme: 'light',
    language: 'en',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    console.log(`⚙️ [SettingsContext] Loading settings for user ${user.id}`);
    loadSettings();
  }, [user]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      console.log(`⚙️ [SettingsContext] Fetching settings from local storage`);
      
      const userSettings = await LocalStorageService.getUserSettings();
      setSettings(userSettings);
      setError(null);
      
      console.log(`✅ [SettingsContext] Settings loaded successfully`);
    } catch (error) {
      console.error('❌ [SettingsContext] Error loading settings:', error);
      setError('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (updates: Partial<UserSettings>) => {
    try {
      console.log(`⚙️ [SettingsContext] Updating settings:`, updates);
      
      await LocalStorageService.updateUserSettings(updates);
      setSettings(prev => ({ ...prev, ...updates }));
      
      console.log(`✅ [SettingsContext] Settings updated successfully`);
    } catch (error) {
      console.error('❌ [SettingsContext] Error updating settings:', error);
      throw error;
    }
  };

  const refreshSettings = async () => {
    console.log(`🔄 [SettingsContext] Manual settings refresh requested`);
    await loadSettings();
  };

  return (
    <SettingsContext.Provider
      value={{
        settings,
        loading,
        error,
        updateSettings,
        refreshSettings,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};