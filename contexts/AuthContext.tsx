import React, { createContext, useContext, useState, useEffect } from 'react';
import { LocalStorageService, User, UserProfile } from '@/services/LocalStorageService';

interface AuthContextData {
  user: User | null;
  userProfile: UserProfile | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (userData: { name: string; email: string; password: string }) => Promise<boolean>;
  logout: () => Promise<void>;
  updateUserProfile: (updates: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkAuthState();
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleLogoutEvent = () => {
        console.log('🔄 [Auth] Logout event detected');
        setUser(null);
        setUserProfile(null);
        setIsAuthenticated(false);
        setError(null);
      };
      
      const handleStorageChange = (e: StorageEvent) => {
        if (e.key === 'logout' && e.newValue === 'true') {
          handleLogoutEvent();
        }
      };
      
      window.addEventListener('logout', handleLogoutEvent);
      window.addEventListener('storage', handleStorageChange);
      
      return () => {
        window.removeEventListener('logout', handleLogoutEvent);
        window.removeEventListener('storage', handleStorageChange);
      };
    }
  }, []);

  const checkAuthState = async () => {
    try {
      setLoading(true);
      console.log('🔐 [Auth] Checking authentication state...');
      
      const currentUser = await LocalStorageService.getCurrentUser();
      
      if (currentUser) {
        console.log(`✅ [Auth] User authenticated: ${currentUser.email}`);
        setUser(currentUser);
        setIsAuthenticated(true);
        
        // Load user profile
        const profile = await LocalStorageService.getUserProfile();
        setUserProfile(profile);
        console.log(`👤 [Auth] Profile loaded:`, profile ? 'Success' : 'Not found');
      } else {
        console.log('🚪 [Auth] No authenticated user found');
        setUser(null);
        setUserProfile(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('❌ [Auth] Error checking auth state:', error);
      setError('Authentication error occurred');
      setUser(null);
      setUserProfile(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      console.log(`🔐 [Auth] Attempting login for: ${email}`);
      
      const loggedUser = await LocalStorageService.loginUser(email, password);
      setUser(loggedUser);
      setIsAuthenticated(true);
      
      // Load user profile
      const profile = await LocalStorageService.getUserProfile();
      setUserProfile(profile);
      
      console.log(`✅ [Auth] Login successful for: ${email}`);
      return true;
    } catch (error: any) {
      console.error('❌ [Auth] Login failed:', error);
      setError('Login failed. Please check your credentials.');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData: { name: string; email: string; password: string }): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      console.log(`📝 [Auth] Attempting registration for: ${userData.email}`);
      
      const newUser = await LocalStorageService.registerUser(userData.email, userData.password, userData.name);
      setUser(newUser);
      setIsAuthenticated(true);
      
      // Load user profile
      const profile = await LocalStorageService.getUserProfile();
      setUserProfile(profile);
      
      console.log(`✅ [Auth] Registration successful for: ${userData.email}`);
      return true;
    } catch (error: any) {
      console.error('❌ [Auth] Registration failed:', error);
      setError('Registration failed. Please try again.');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      console.log('🚪 [Auth] Starting logout process...');
      setLoading(true);
      
      await LocalStorageService.logoutUser();
      
      setUser(null);
      setUserProfile(null);
      setIsAuthenticated(false);
      setError(null);
      
      console.log('✅ [Auth] Logout completed successfully');
    } catch (error) {
      console.error('❌ [Auth] Error during logout:', error);
      
      // Force logout even if service fails
      setUser(null);
      setUserProfile(null);
      setIsAuthenticated(false);
      setError(null);
    } finally {
      setLoading(false);
    }
  };

  const updateUserProfile = async (updates: Partial<UserProfile>) => {
    try {
      setError(null);
      console.log(`🔄 [Auth] Updating user profile...`);
      
      await LocalStorageService.updateUserProfile(updates);
      
      // Update local state
      setUserProfile(prev => prev ? { ...prev, ...updates } : null);
      
      console.log(`✅ [Auth] Profile updated successfully`);
    } catch (error) {
      console.error('❌ [Auth] Error updating profile:', error);
      setError('Failed to update profile. Please try again.');
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        isAuthenticated,
        loading,
        error,
        login,
        register,
        logout,
        updateUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};