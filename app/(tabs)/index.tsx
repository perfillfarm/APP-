import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Dimensions } from 'react-native';
import { Target, TrendingUp, Award, Clock, Wifi, WifiOff, CircleCheck as CheckCircle, Calendar, Zap, Activity, ChartBar as BarChart3 } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useRecords } from '@/contexts/RecordsContext';
import { useStats } from '@/contexts/StatsContext';
import { useTutorial } from '@/hooks/useTutorial';
import { useDailyReset } from '@/hooks/useDailyReset';
import { TutorialModal } from '@/components/ui/TutorialModal';
import { DailyCheckCard } from '@/components/cards/DailyCheckCard';
import { ProgressCard } from '@/components/cards/ProgressCard';
import { Card } from '@/components/ui/Card';
import { Header } from '@/components/ui/Header';
import Animated, { FadeIn, FadeInDown, FadeInUp, SlideInRight } from 'react-native-reanimated';

const { width: screenWidth } = Dimensions.get('window');

export default function HomeScreen() {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { user, userProfile } = useAuth();
  const { records, createRecord, updateRecord, getRecordByDate, syncStatus } = useRecords();
  const { stats } = useStats();
  const { showTutorial, completeTutorial, skipTutorial } = useTutorial();
  const [todayRecord, setTodayRecord] = useState<any>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [canCheckIn, setCanCheckIn] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date().toISOString().split('T')[0]);
  const [currentMonthStats, setCurrentMonthStats] = useState({
    progress: 0,
    completedDays: 0,
    totalDaysInMonth: 0,
  });

  // Use daily reset hook for better day change detection
  useDailyReset({
    onDayChange: (newDate, oldDate) => {
      console.log(`📅 [Home] Day changed from ${oldDate} to ${newDate}`);
      setCurrentDate(newDate);
      setIsCompleted(false);
      setCanCheckIn(true);
      setTodayRecord(null);
    }
  });

  // Extract first name only
  const getFirstName = (fullName: string) => {
    if (!fullName) return 'User';
    return fullName.trim().split(' ')[0];
  };
  
  const userName = getFirstName(userProfile?.name || user?.name || '');

  useEffect(() => {
    console.log(`🏠 [Home] Records updated: ${records.length} records for current date: ${currentDate}`);
    loadTodayRecord();
    checkCanCheckIn();
    calculateCurrentMonthStats();
  }, [records, currentDate]);

  // Calculate statistics only for current month for HOME
  const calculateCurrentMonthStats = () => {
    try {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth();
      
      // First and last day of current month
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      const totalDaysInMonth = lastDay.getDate();
      
      // Filter only current month records
      const currentMonthRecords = records.filter(record => {
        const recordDate = new Date(record.date);
        return recordDate >= firstDay && recordDate <= lastDay;
      });
      
      const completedRecords = currentMonthRecords.filter(r => r.completed);
      const completedDays = completedRecords.length;
      const progress = (completedDays / totalDaysInMonth) * 100;
      
      const newCurrentMonthStats = {
        progress,
        completedDays,
        totalDaysInMonth,
      };
      
      setCurrentMonthStats(newCurrentMonthStats);
    } catch (error) {
      console.error('❌ [Home] Error calculating current month stats:', error);
      setCurrentMonthStats({
        progress: 0,
        completedDays: 0,
        totalDaysInMonth: 0,
      });
    }
  };

  const checkCanCheckIn = () => {
    const todayRecord = records.find(record => record.date === currentDate);
    const hasCompletedToday = todayRecord?.completed || false;
    
    // Only update if it really changed
    if (canCheckIn === hasCompletedToday) {
      setCanCheckIn(!hasCompletedToday);
    }
    if (isCompleted !== hasCompletedToday) {
      setIsCompleted(hasCompletedToday);
    }
  };

  // Check if it's a new day on component mount and focus
  useEffect(() => {
    const handleFocus = () => {
      const newDate = new Date().toISOString().split('T')[0];
      if (newDate !== currentDate) {
        setCurrentDate(newDate);
      }
    };
  }, [currentDate]);

  const loadTodayRecord = async () => {
    try {
      // Search for today's record in loaded records
      const todayRecord = records.find(record => record.date === currentDate);
      if (todayRecord) {
        setTodayRecord(todayRecord);
        setIsCompleted(todayRecord.completed);
        setCanCheckIn(!todayRecord.completed);
      } else {
        setTodayRecord(null);
        setIsCompleted(false);
        setCanCheckIn(true);
      }
    } catch (error) {
      console.error('❌ [Home] Error loading today record:', error);
    }
  };

  const toggleDailyCompletion = async () => {
    if (loading) {
      return;
    }

    // Check current state again
    const currentTodayRecord = records.find(record => record.date === currentDate);
    const alreadyCompleted = currentTodayRecord?.completed || false;
    
    if (alreadyCompleted) {
      Alert.alert(
        t('dailyCheckCompleted'),
        t('nextCheckInAvailable'),
        [{ text: t('ok') }]
      );
      return;
    }
    
    // Double check if it's still the same day
    const currentDay = new Date().toISOString().split('T')[0];
    if (currentDay !== currentDate) {
      setCurrentDate(currentDay);
      return;
    }
    
    try {
      setLoading(true);
      
      const currentTime = new Date().toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
      
      const recordData = {
        date: currentDate,
        capsules: 2, // Default dosage
        time: currentTime,
        notes: '',
        completed: true,
      };

      const currentTodayRecord = records.find(record => record.date === currentDate);
      
      if (currentTodayRecord?.id) {
        // Update existing record
        await updateRecord(currentTodayRecord.id, recordData);
      } else {
        // Create new record
        await createRecord(recordData);
      }

      // Wait a bit for processing
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Force local state update
      setIsCompleted(true);
      setCanCheckIn(false);
      
      // Show success feedback
      Alert.alert(
        '🎉 ' + t('congratulations'), 
        t('recordSavedSuccess'),
        [{ text: t('ok') }]
      );
      
    } catch (error) {
      console.error('❌ [Home] Error updating completion:', error);
      
      Alert.alert(
        t('error'), 
        t('couldNotUpdateCompletion') || 'Could not update check-in. Please try again.',
        [{ text: t('ok') }]
      );
    } finally {
      setLoading(false);
    }
  };

  const ModernStatCard = ({ icon: Icon, title, value, subtitle, color, delay = 0 }: any) => (
    <Animated.View entering={FadeInDown.delay(delay).springify()}>
      <LinearGradient
        colors={[theme.colors.card, theme.colors.surface]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.modernStatCard, { borderColor: color + '20' }]}
      >
        <View style={[styles.statIconContainer, { backgroundColor: color + '15' }]}>
          <Icon size={22} color={color} strokeWidth={2.5} />
        </View>
        <View style={styles.statContent}>
          <Text style={[styles.statValue, { color: theme.colors.text }]}>
            {value}
          </Text>
          <Text style={[styles.statTitle, { color: theme.colors.textSecondary }]}>
            {title}
          </Text>
          {subtitle && (
            <Text style={[styles.statSubtitle, { color: theme.colors.textSecondary }]}>
              {subtitle}
            </Text>
          )}
        </View>
        <View style={[styles.statAccent, { backgroundColor: color }]} />
      </LinearGradient>
    </Animated.View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Header 
        title={`${t('hello')}, ${userName}!`}
        subtitle={t('howIsYourProgress')}
      />
      
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Sync Status Indicator */}
        {syncStatus !== 'synced' && (
          <Animated.View entering={FadeIn} style={[styles.syncIndicator, { 
            backgroundColor: syncStatus === 'syncing' ? theme.colors.warning + '15' : theme.colors.error + '15',
            borderColor: syncStatus === 'syncing' ? theme.colors.warning + '30' : theme.colors.error + '30'
          }]}>
            {syncStatus === 'syncing' ? (
              <Wifi size={16} color={theme.colors.warning} />
            ) : (
              <WifiOff size={16} color={theme.colors.error} />
            )}
            <Text style={[styles.syncText, { 
              color: syncStatus === 'syncing' ? theme.colors.warning : theme.colors.error 
            }]}>
              {syncStatus === 'syncing' ? 'Sincronizando...' : 'Erro de sincronização'}
            </Text>
          </Animated.View>
        )}

        {/* Hero Section - Daily Check-in */}
        <Animated.View entering={FadeInUp.delay(200)} style={styles.heroSection}>
          <DailyCheckCard
            isCompleted={isCompleted}
            onToggle={toggleDailyCompletion}
            canCheckIn={canCheckIn}
            capsules={todayRecord?.capsules || 2}
            time={todayRecord?.time || '--:--'}
            streak={stats.currentStreak}
            loading={loading}
          />
        </Animated.View>

        {/* Progress Overview */}
        <Animated.View entering={FadeInDown.delay(400)} style={styles.progressSection}>
          <ProgressCard
            progress={currentMonthStats.progress}
            completedDays={currentMonthStats.completedDays}
            totalDays={currentMonthStats.totalDaysInMonth}
            records={records}
          />
        </Animated.View>

        {/* Detailed Statistics */}
        <Animated.View entering={FadeInDown.delay(600)} style={styles.statsSection}>
          <View style={styles.modernStatsGrid}>
            <ModernStatCard
              icon={Target}
              title={t('totalDays')}
              value={stats.totalDays}
              subtitle={t('completedDays')}
              color={theme.colors.success}
              delay={700}
            />
            <ModernStatCard
              icon={TrendingUp}
              title={t('currentStreak')}
              value={`${stats.currentStreak}`}
              subtitle={t('consecutive') + ' ' + t('days')}
              color="#EA580C"
              delay={800}
            />
            <ModernStatCard
              icon={Award}
              title={t('averageCapsules')}
              value={`${stats.averageCapsules.toFixed(1)}`}
              subtitle={t('perDay')}
              color="#7C3AED"
              delay={900}
            />
            <ModernStatCard
              icon={Clock}
              title={t('consistency')}
              value={`${stats.completionRate.toFixed(0)}%`}
              subtitle={t('last30Days')}
              color={theme.colors.error}
              delay={1000}
            />
          </View>
        </Animated.View>

        {/* Dosage Information */}
        <Animated.View entering={FadeInDown.delay(1200)} style={styles.infoSection}>
          <Card style={styles.dosageCard}>
            <Text style={[styles.dosageTitle, { color: theme.colors.text }]} numberOfLines={1} adjustsFontSizeToFit>
              {t('dailyRecommendedDosage')}
            </Text>
            
            <Text style={[styles.dosageDescription, { color: theme.colors.textSecondary }]}>
              {t('dosageDescription')}
            </Text>
            
            <View style={styles.dosageInstructions}>
              <View style={styles.instructionItem}>
                <View style={[styles.instructionBullet, { backgroundColor: theme.colors.primary }]} />
                <Text style={[styles.instructionText, { color: theme.colors.textSecondary }]}>
                  {t('takeSameTime')}
                </Text>
              </View>
              <View style={styles.instructionItem}>
                <View style={[styles.instructionBullet, { backgroundColor: theme.colors.primary }]} />
                <Text style={[styles.instructionText, { color: theme.colors.textSecondary }]}>
                  {t('preferablyMorning')}
                </Text>
              </View>
              <View style={styles.instructionItem}>
                <View style={[styles.instructionBullet, { backgroundColor: theme.colors.primary }]} />
                <Text style={[styles.instructionText, { color: theme.colors.textSecondary }]}>
                  {t('maintainRegularity')}
                </Text>
              </View>
            </View>
            
            <View style={styles.dosageBadgeContainer}>
              <View style={[styles.dosageBadge, { backgroundColor: theme.colors.primary }]}>
                <Text style={styles.dosageBadgeText}>
                  {t('capsulesPerDay')}
                </Text>
              </View>
            </View>
          </Card>
        </Animated.View>

        {/* Product Information */}
        <Animated.View entering={FadeInDown.delay(1400)} style={styles.infoSection}>
          <Card style={styles.productCard}>
            <View style={styles.productHeader}>
              <View style={[styles.productIcon, { backgroundColor: theme.colors.secondary + '15' }]}>
                <Text style={styles.productEmoji}>🧬</Text>
              </View>
              <Text style={[styles.productTitle, { color: theme.colors.text }]}>
                {t('aboutMaxTestorin')}
              </Text>
            </View>
            <Text style={[styles.productDescription, { color: theme.colors.textSecondary }]}>
              {t('productDescription')}
            </Text>
          </Card>
        </Animated.View>

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Tutorial Modal */}
      <TutorialModal
        visible={showTutorial}
        onClose={() => {
          console.log('🎓 [Home] Tutorial modal closed - completing tutorial');
          completeTutorial();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  syncIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 8,
    borderRadius: 16,
    borderWidth: 1,
  },
  syncText: {
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 8,
  },
  heroSection: {
    paddingTop: 8,
    marginBottom: 32,
  },
  progressSection: {
    marginBottom: 32,
  },
  statsSection: {
    marginBottom: 32,
  },
  modernStatsGrid: {
    paddingHorizontal: 20,
    gap: 16,
  },
  modernStatCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 6,
    position: 'relative',
    overflow: 'hidden',
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  statTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  statSubtitle: {
    fontSize: 12,
    fontWeight: '500',
  },
  statAccent: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 4,
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
  },
  infoSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  dosageCard: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  dosageTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 20,
    textAlign: 'center',
  },
  dosageBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'center',
  },
  dosageBadgeText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  dosageBadgeContainer: {
    alignItems: 'center',
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  dosageDescription: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 20,
  },
  dosageInstructions: {
    gap: 12,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  instructionBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 8,
    marginRight: 12,
  },
  instructionText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  productCard: {
    padding: 24,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 6,
  },
  productHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  productIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  productEmoji: {
    fontSize: 20,
  },
  productTitle: {
    fontSize: 20,
    fontWeight: '700',
    flex: 1,
  },
  productDescription: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'justify',
  },
  bottomSpacing: {
    height: 20,
  },
});