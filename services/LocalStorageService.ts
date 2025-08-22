import AsyncStorage from '@react-native-async-storage/async-storage';

// Types
export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  name: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other';
  email: string;
  phone?: string;
  profileImageUrl?: string;
  treatmentStartDate?: string;
  hasSeenTutorial?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DailyRecord {
  id: string;
  date: string;
  capsules: number;
  time: string;
  notes?: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserSettings {
  notifications: boolean;
  reminderTime: string;
  dailyGoal: number;
  weeklyGoal: number;
  theme: 'light' | 'dark';
  language: 'en' | 'pt';
  createdAt: string;
  updatedAt: string;
}

export class LocalStorageService {
  private static readonly STORAGE_KEYS = {
    USERS: 'registeredUsers',
    CURRENT_USER: 'currentUser',
    AUTH_TOKEN: 'authToken',
    USER_PROFILE: 'userProfile',
    DAILY_RECORDS: 'dailyRecords',
    USER_SETTINGS: 'userSettings',
    APP_THEME: 'appTheme',
    APP_LANGUAGE: 'appLanguage',
    TUTORIAL_SEEN: 'tutorialSeen',
  };

  // Authentication Methods
  static async registerUser(email: string, password: string, name: string): Promise<User> {
    try {
      console.log(`📝 [LocalStorage] Registering user: ${email}`);
      
      // Check if email already exists
      const users = await this.getAllUsers();
      const existingUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
      
      if (existingUser) {
        throw new Error('Email already exists');
      }
      
      const newUser: User = {
        id: `user_${Date.now()}`,
        email,
        name,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      // Add to users list
      users.push(newUser);
      await AsyncStorage.setItem(this.STORAGE_KEYS.USERS, JSON.stringify(users));
      
      // Set as current user
      await AsyncStorage.setItem(this.STORAGE_KEYS.CURRENT_USER, JSON.stringify(newUser));
      await AsyncStorage.setItem(this.STORAGE_KEYS.AUTH_TOKEN, `token_${Date.now()}`);
      
      // Create default profile
      const defaultProfile: UserProfile = {
        name,
        email,
        treatmentStartDate: new Date().toLocaleDateString('pt-BR'),
        hasSeenTutorial: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await AsyncStorage.setItem(this.STORAGE_KEYS.USER_PROFILE, JSON.stringify(defaultProfile));
      
      // Create default settings
      const defaultSettings: UserSettings = {
        notifications: true,
        reminderTime: '09:00',
        dailyGoal: 2,
        weeklyGoal: 14,
        theme: 'light',
        language: 'en',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await AsyncStorage.setItem(this.STORAGE_KEYS.USER_SETTINGS, JSON.stringify(defaultSettings));
      
      console.log(`✅ [LocalStorage] User registered successfully: ${email}`);
      return newUser;
    } catch (error) {
      console.error('❌ [LocalStorage] Error registering user:', error);
      throw error;
    }
  }

  static async loginUser(email: string, password: string): Promise<User> {
    try {
      console.log(`🔐 [LocalStorage] Attempting login: ${email}`);
      
      const users = await this.getAllUsers();
      const user = users.find(u => 
        u.email.toLowerCase() === email.toLowerCase()
      );
      
      if (!user) {
        throw new Error('User not found');
      }
      
      // In a real app, you'd verify the password here
      // For this demo, we'll assume password is correct if user exists
      
      // Set as current user
      await AsyncStorage.setItem(this.STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
      await AsyncStorage.setItem(this.STORAGE_KEYS.AUTH_TOKEN, `token_${Date.now()}`);
      
      console.log(`✅ [LocalStorage] User logged in successfully: ${email}`);
      return user;
    } catch (error) {
      console.error('❌ [LocalStorage] Error logging in:', error);
      throw error;
    }
  }

  static async getCurrentUser(): Promise<User | null> {
    try {
      const userData = await AsyncStorage.getItem(this.STORAGE_KEYS.CURRENT_USER);
      const authToken = await AsyncStorage.getItem(this.STORAGE_KEYS.AUTH_TOKEN);
      
      if (userData && authToken) {
        return JSON.parse(userData);
      }
      return null;
    } catch (error) {
      console.error('❌ [LocalStorage] Error getting current user:', error);
      return null;
    }
  }

  static async logoutUser(): Promise<void> {
    try {
      console.log('🚪 [LocalStorage] Logging out user...');
      
      await AsyncStorage.multiRemove([
        this.STORAGE_KEYS.CURRENT_USER,
        this.STORAGE_KEYS.AUTH_TOKEN,
      ]);
      
      // Dispatch logout event for cross-tab synchronization
      if (typeof window !== 'undefined') {
        localStorage.setItem('logout', 'true');
        setTimeout(() => {
          localStorage.removeItem('logout');
        }, 1000);
        window.dispatchEvent(new CustomEvent('logout'));
      }
      
      console.log('✅ [LocalStorage] User logged out successfully');
    } catch (error) {
      console.error('❌ [LocalStorage] Error logging out:', error);
      throw error;
    }
  }

  private static async getAllUsers(): Promise<User[]> {
    try {
      const usersData = await AsyncStorage.getItem(this.STORAGE_KEYS.USERS);
      return usersData ? JSON.parse(usersData) : [];
    } catch (error) {
      console.error('❌ [LocalStorage] Error getting all users:', error);
      return [];
    }
  }

  // User Profile Methods
  static async getUserProfile(): Promise<UserProfile | null> {
    try {
      const profileData = await AsyncStorage.getItem(this.STORAGE_KEYS.USER_PROFILE);
      return profileData ? JSON.parse(profileData) : null;
    } catch (error) {
      console.error('❌ [LocalStorage] Error getting user profile:', error);
      return null;
    }
  }

  static async updateUserProfile(updates: Partial<UserProfile>): Promise<void> {
    try {
      console.log(`🔄 [LocalStorage] Updating user profile:`, updates);
      
      const currentProfile = await this.getUserProfile();
      const updatedProfile = {
        ...currentProfile,
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      
      await AsyncStorage.setItem(this.STORAGE_KEYS.USER_PROFILE, JSON.stringify(updatedProfile));
      console.log(`✅ [LocalStorage] User profile updated successfully`);
    } catch (error) {
      console.error('❌ [LocalStorage] Error updating user profile:', error);
      throw error;
    }
  }

  // Tutorial Methods
  static async markTutorialAsSeen(): Promise<void> {
    try {
      console.log(`🎓 [LocalStorage] Marking tutorial as seen`);
      await AsyncStorage.setItem(this.STORAGE_KEYS.TUTORIAL_SEEN, 'true');
      
      // Also update user profile
      const profile = await this.getUserProfile();
      if (profile) {
        await this.updateUserProfile({ hasSeenTutorial: true });
      }
      
      console.log(`✅ [LocalStorage] Tutorial marked as seen`);
    } catch (error) {
      console.error('❌ [LocalStorage] Error marking tutorial as seen:', error);
      throw error;
    }
  }

  static async hasUserSeenTutorial(): Promise<boolean> {
    try {
      const tutorialSeen = await AsyncStorage.getItem(this.STORAGE_KEYS.TUTORIAL_SEEN);
      const profile = await this.getUserProfile();
      
      return tutorialSeen === 'true' || profile?.hasSeenTutorial === true;
    } catch (error) {
      console.error('❌ [LocalStorage] Error checking tutorial status:', error);
      return false;
    }
  }

  static async resetTutorialStatus(): Promise<void> {
    try {
      console.log(`🔄 [LocalStorage] Resetting tutorial status`);
      await AsyncStorage.removeItem(this.STORAGE_KEYS.TUTORIAL_SEEN);
      
      const profile = await this.getUserProfile();
      if (profile) {
        await this.updateUserProfile({ hasSeenTutorial: false });
      }
      
      console.log(`✅ [LocalStorage] Tutorial status reset`);
    } catch (error) {
      console.error('❌ [LocalStorage] Error resetting tutorial status:', error);
      throw error;
    }
  }

  // Daily Records Methods
  static async createDailyRecord(record: Omit<DailyRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      console.log(`💊 [LocalStorage] Creating daily record for ${record.date}:`, record);
      
      const records = await this.getDailyRecords();
      const recordId = `record_${Date.now()}`;
      
      const newRecord: DailyRecord = {
        ...record,
        id: recordId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      records.push(newRecord);
      await AsyncStorage.setItem(this.STORAGE_KEYS.DAILY_RECORDS, JSON.stringify(records));
      
      console.log(`✅ [LocalStorage] Daily record created with ID: ${recordId}`);
      return recordId;
    } catch (error) {
      console.error('❌ [LocalStorage] Error creating daily record:', error);
      throw error;
    }
  }

  static async getDailyRecords(): Promise<DailyRecord[]> {
    try {
      const recordsData = await AsyncStorage.getItem(this.STORAGE_KEYS.DAILY_RECORDS);
      const records = recordsData ? JSON.parse(recordsData) : [];
      
      // Sort by date (most recent first)
      records.sort((a: DailyRecord, b: DailyRecord) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      
      return records;
    } catch (error) {
      console.error('❌ [LocalStorage] Error getting daily records:', error);
      return [];
    }
  }

  static async getDailyRecordByDate(date: string): Promise<DailyRecord | null> {
    try {
      const records = await this.getDailyRecords();
      return records.find(r => r.date === date) || null;
    } catch (error) {
      console.error('❌ [LocalStorage] Error getting daily record by date:', error);
      return null;
    }
  }

  static async updateDailyRecord(recordId: string, updates: Partial<DailyRecord>): Promise<void> {
    try {
      console.log(`🔄 [LocalStorage] Updating daily record ${recordId}:`, updates);
      
      const records = await this.getDailyRecords();
      const recordIndex = records.findIndex(r => r.id === recordId);
      
      if (recordIndex === -1) {
        throw new Error('Record not found');
      }
      
      records[recordIndex] = {
        ...records[recordIndex],
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      
      await AsyncStorage.setItem(this.STORAGE_KEYS.DAILY_RECORDS, JSON.stringify(records));
      console.log(`✅ [LocalStorage] Daily record updated successfully`);
    } catch (error) {
      console.error('❌ [LocalStorage] Error updating daily record:', error);
      throw error;
    }
  }

  static async deleteDailyRecord(recordId: string): Promise<void> {
    try {
      console.log(`🗑️ [LocalStorage] Deleting daily record ${recordId}`);
      
      const records = await this.getDailyRecords();
      const filteredRecords = records.filter(r => r.id !== recordId);
      
      await AsyncStorage.setItem(this.STORAGE_KEYS.DAILY_RECORDS, JSON.stringify(filteredRecords));
      console.log(`✅ [LocalStorage] Daily record deleted successfully`);
    } catch (error) {
      console.error('❌ [LocalStorage] Error deleting daily record:', error);
      throw error;
    }
  }

  static async clearAllDailyRecords(): Promise<void> {
    try {
      await AsyncStorage.setItem(this.STORAGE_KEYS.DAILY_RECORDS, JSON.stringify([]));
      console.log(`✅ [LocalStorage] All daily records cleared`);
    } catch (error) {
      console.error('❌ [LocalStorage] Error clearing daily records:', error);
      throw error;
    }
  }

  // User Settings Methods
  static async getUserSettings(): Promise<UserSettings> {
    try {
      const settingsData = await AsyncStorage.getItem(this.STORAGE_KEYS.USER_SETTINGS);
      
      if (settingsData) {
        return JSON.parse(settingsData);
      }
      
      // Return default settings if none exist
      const defaultSettings: UserSettings = {
        notifications: true,
        reminderTime: '09:00',
        dailyGoal: 2,
        weeklyGoal: 14,
        theme: 'light',
        language: 'en',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      await AsyncStorage.setItem(this.STORAGE_KEYS.USER_SETTINGS, JSON.stringify(defaultSettings));
      return defaultSettings;
    } catch (error) {
      console.error('❌ [LocalStorage] Error getting user settings:', error);
      // Return default settings on error
      return {
        notifications: true,
        reminderTime: '09:00',
        dailyGoal: 2,
        weeklyGoal: 14,
        theme: 'light',
        language: 'en',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }
  }

  static async updateUserSettings(updates: Partial<UserSettings>): Promise<void> {
    try {
      console.log(`⚙️ [LocalStorage] Updating user settings:`, updates);
      
      const currentSettings = await this.getUserSettings();
      const updatedSettings = {
        ...currentSettings,
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      
      await AsyncStorage.setItem(this.STORAGE_KEYS.USER_SETTINGS, JSON.stringify(updatedSettings));
      console.log(`✅ [LocalStorage] User settings updated successfully`);
    } catch (error) {
      console.error('❌ [LocalStorage] Error updating user settings:', error);
      throw error;
    }
  }

  // Data Management
  static async exportAllData(): Promise<string> {
    try {
      const data = {
        user: await this.getCurrentUser(),
        profile: await this.getUserProfile(),
        records: await this.getDailyRecords(),
        settings: await this.getUserSettings(),
        metadata: {
          version: '1.0.0',
          exportDate: new Date().toISOString(),
          platform: 'MaxTestorin Tracker',
        },
      };
      
      return JSON.stringify(data, null, 2);
    } catch (error) {
      console.error('❌ [LocalStorage] Error exporting data:', error);
      throw error;
    }
  }

  static async importAllData(jsonData: string): Promise<void> {
    try {
      const data = JSON.parse(jsonData);
      
      if (data.profile) {
        await AsyncStorage.setItem(this.STORAGE_KEYS.USER_PROFILE, JSON.stringify(data.profile));
      }
      
      if (data.records) {
        await AsyncStorage.setItem(this.STORAGE_KEYS.DAILY_RECORDS, JSON.stringify(data.records));
      }
      
      if (data.settings) {
        await AsyncStorage.setItem(this.STORAGE_KEYS.USER_SETTINGS, JSON.stringify(data.settings));
      }
      
      console.log(`✅ [LocalStorage] Data imported successfully`);
    } catch (error) {
      console.error('❌ [LocalStorage] Error importing data:', error);
      throw error;
    }
  }

  static async clearAllData(): Promise<void> {
    try {
      console.log('🧹 [LocalStorage] Clearing all data...');
      
      const keys = Object.values(this.STORAGE_KEYS);
      await AsyncStorage.multiRemove(keys);
      
      console.log('✅ [LocalStorage] All data cleared successfully');
    } catch (error) {
      console.error('❌ [LocalStorage] Error clearing all data:', error);
      throw error;
    }
  }

  static async getStorageStats(): Promise<{
    totalSize: number;
    itemCount: number;
    breakdown: Record<string, number>;
  }> {
    try {
      const keys = Object.values(this.STORAGE_KEYS);
      const breakdown: Record<string, number> = {};
      let totalSize = 0;
      let itemCount = 0;

      for (const key of keys) {
        try {
          const value = await AsyncStorage.getItem(key);
          if (value) {
            const size = new Blob([value]).size;
            breakdown[key] = size;
            totalSize += size;
            itemCount++;
          }
        } catch (error) {
          breakdown[key] = 0;
        }
      }

      return {
        totalSize,
        itemCount,
        breakdown,
      };
    } catch (error) {
      console.error('❌ [LocalStorage] Error getting storage stats:', error);
      return {
        totalSize: 0,
        itemCount: 0,
        breakdown: {},
      };
    }
  }
}