import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { LocalStorageService } from '@/services/LocalStorageService';

export const useTutorial = () => {
  const { user, isAuthenticated } = useAuth();
  const [showTutorial, setShowTutorial] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkTutorialStatus();
  }, [user, isAuthenticated]);

  const checkTutorialStatus = async () => {
    try {
      if (!user || !isAuthenticated) {
        console.log('🎓 [Tutorial] No authenticated user, hiding tutorial');
        setShowTutorial(false);
        setLoading(false);
        return;
      }

      console.log(`🎓 [Tutorial] Checking tutorial status for user ${user.id}`);
      setLoading(true);
      
      const hasSeenTutorial = await LocalStorageService.hasUserSeenTutorial();
      
      if (hasSeenTutorial) {
        console.log(`🎓 [Tutorial] User ${user.id} has already seen tutorial - NOT showing`);
        setShowTutorial(false);
      } else {
        console.log(`🎓 [Tutorial] User ${user.id} has NOT seen tutorial - SHOWING tutorial`);
        setShowTutorial(true);
      }
    } catch (error) {
      console.error('❌ [Tutorial] Error checking tutorial status:', error);
      setShowTutorial(false);
    } finally {
      setLoading(false);
    }
  };

  const completeTutorial = async () => {
    try {
      if (!user) {
        console.warn('⚠️ [Tutorial] No user found when trying to complete tutorial');
        return;
      }

      console.log(`🎓 [Tutorial] Marking tutorial as COMPLETED for user ${user.id}`);
      
      await LocalStorageService.markTutorialAsSeen();
      setShowTutorial(false);
      
      console.log(`✅ [Tutorial] Tutorial PERMANENTLY completed for user ${user.id}`);
    } catch (error) {
      console.error('❌ [Tutorial] Error marking tutorial as completed:', error);
      setShowTutorial(false);
    }
  };

  const resetTutorial = async () => {
    try {
      if (!user) {
        console.warn('⚠️ [Tutorial] No user found when trying to reset tutorial');
        return;
      }

      console.log(`🔄 [Tutorial] Resetting tutorial for user ${user.id}`);
      
      await LocalStorageService.resetTutorialStatus();
      setShowTutorial(true);
      
      console.log(`✅ [Tutorial] Tutorial reset for user ${user.id}`);
    } catch (error) {
      console.error('❌ [Tutorial] Error resetting tutorial:', error);
    }
  };

  const skipTutorial = async () => {
    console.log(`⏭️ [Tutorial] User skipped tutorial - marking as completed PERMANENTLY`);
    await completeTutorial();
  };

  return {
    showTutorial,
    loading,
    completeTutorial,
    resetTutorial,
    skipTutorial,
  };
};