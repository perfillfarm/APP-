import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { RecordsProvider } from '@/contexts/RecordsContext';
import { StatsProvider } from '@/contexts/StatsContext';
import { SettingsProvider } from '@/contexts/SettingsContext';
import { router } from 'expo-router';

export default function RootLayout() {
  useFrameworkReady();

  // Listen for logout events
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleLogout = () => {
        console.log('🔄 [RootLayout] Logout event detected');
        setTimeout(() => {
          router.replace('/auth/login');
        }, 50);
      };
      
      window.addEventListener('logout', handleLogout);
      return () => window.removeEventListener('logout', handleLogout);
    }
  }, []);

  return (
    <LanguageProvider>
      <ThemeProvider>
        <AuthProvider>
          <RecordsProvider>
            <StatsProvider>
              <SettingsProvider>
                <Stack screenOptions={{ headerShown: false }}>
                  <Stack.Screen name="index" />
                  <Stack.Screen name="auth" />
                  <Stack.Screen name="(tabs)" />
                  <Stack.Screen name="+not-found" />
                </Stack>
                <StatusBar style="auto" />
              </SettingsProvider>
            </StatsProvider>
          </RecordsProvider>
        </AuthProvider>
      </ThemeProvider>
    </LanguageProvider>
  );
}