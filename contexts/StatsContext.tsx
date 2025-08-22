import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRecords } from '@/contexts/RecordsContext';

interface Stats {
  totalDays: number;
  currentStreak: number;
  averageCapsules: number;
  completionRate: number;
  totalCapsules: number;
  monthlyProgress: number;
  completedDaysThisMonth: number;
}

interface StatsContextData {
  stats: Stats;
  loading: boolean;
  refreshStats: () => void;
}

const StatsContext = createContext<StatsContextData>({} as StatsContextData);

export const StatsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { records } = useRecords();
  const [stats, setStats] = useState<Stats>({
    totalDays: 0,
    currentStreak: 0,
    averageCapsules: 0,
    completionRate: 0,
    totalCapsules: 0,
    monthlyProgress: 0,
    completedDaysThisMonth: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    calculateStats();
  }, [records]);

  const calculateStats = () => {
    setLoading(true);
    
    try {
      const completedRecords = records.filter(r => r.completed);
      const totalDays = completedRecords.length;
      const totalCapsules = completedRecords.reduce((sum, r) => sum + r.capsules, 0);
      const averageCapsules = totalDays > 0 ? totalCapsules / totalDays : 0;

      // Calculate current streak
      let currentStreak = 0;
      const streakRecords = completedRecords
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      const today = new Date().toISOString().split('T')[0];
      for (let i = 0; i < streakRecords.length; i++) {
        const recordDate = streakRecords[i].date;
        const expectedDate = new Date();
        expectedDate.setDate(expectedDate.getDate() - i);
        const expectedDateStr = expectedDate.toISOString().split('T')[0];

        if (recordDate === expectedDateStr) {
          currentStreak++;
        } else {
          break;
        }
      }

      // Calculate completion rate (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const last30DaysRecords = records.filter(r => {
        const recordDate = new Date(r.date);
        return recordDate >= thirtyDaysAgo;
      });
      
      const completedLast30Days = last30DaysRecords.filter(r => r.completed).length;
      const completionRate = (completedLast30Days / 30) * 100;

      // Monthly progress
      const monthlyProgress = completionRate;
      const completedDaysThisMonth = completedLast30Days;

      const newStats = {
        totalDays,
        currentStreak,
        averageCapsules,
        completionRate,
        totalCapsules,
        monthlyProgress,
        completedDaysThisMonth,
      };

      setStats(newStats);
    } catch (error) {
      console.error('❌ [StatsContext] Error calculating stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshStats = () => {
    calculateStats();
  };

  return (
    <StatsContext.Provider
      value={{
        stats,
        loading,
        refreshStats,
      }}
    >
      {children}
    </StatsContext.Provider>
  );
};

export const useStats = () => {
  const context = useContext(StatsContext);
  if (!context) {
    throw new Error('useStats must be used within a StatsProvider');
  }
  return context;
};