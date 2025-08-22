import React, { createContext, useContext, useState, useEffect } from 'react';
import { LocalStorageService, DailyRecord } from '@/services/LocalStorageService';
import { useAuth } from '@/contexts/AuthContext';

interface RecordsContextData {
  records: DailyRecord[];
  loading: boolean;
  error: string | null;
  syncStatus: 'synced' | 'syncing' | 'error';
  createRecord: (recordData: Omit<DailyRecord, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateRecord: (recordId: string, updates: Partial<DailyRecord>) => Promise<void>;
  deleteRecord: (recordId: string) => Promise<void>;
  getRecordByDate: (date: string) => Promise<DailyRecord | null>;
  refreshRecords: () => Promise<void>;
}

const RecordsContext = createContext<RecordsContextData>({} as RecordsContextData);

export const RecordsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [records, setRecords] = useState<DailyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'error'>('synced');

  useEffect(() => {
    if (!user) {
      setRecords([]);
      setLoading(false);
      return;
    }

    console.log(`📊 [RecordsContext] Loading records for user ${user.id}`);
    loadRecords();
  }, [user]);

  const loadRecords = async () => {
    try {
      setLoading(true);
      const dailyRecords = await LocalStorageService.getDailyRecords();
      
      console.log(`📊 [RecordsContext] Loaded ${dailyRecords.length} records`);
      setRecords(dailyRecords);
      setError(null);
      setSyncStatus('synced');
    } catch (error) {
      console.error('❌ [RecordsContext] Error loading records:', error);
      setError('Failed to load records');
      setSyncStatus('error');
    } finally {
      setLoading(false);
    }
  };

  const createRecord = async (recordData: Omit<DailyRecord, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      setSyncStatus('syncing');
      console.log(`📝 [RecordsContext] Creating record for ${recordData.date}`);
      
      await LocalStorageService.createDailyRecord(recordData);
      await loadRecords(); // Refresh records
      
      console.log(`✅ [RecordsContext] Record created successfully`);
    } catch (error) {
      setSyncStatus('error');
      console.error('❌ [RecordsContext] Error creating record:', error);
      throw error;
    }
  };

  const updateRecord = async (recordId: string, updates: Partial<DailyRecord>) => {
    try {
      setSyncStatus('syncing');
      console.log(`🔄 [RecordsContext] Updating record ${recordId}`);
      
      await LocalStorageService.updateDailyRecord(recordId, updates);
      await loadRecords(); // Refresh records
      
      console.log(`✅ [RecordsContext] Record updated successfully`);
    } catch (error) {
      setSyncStatus('error');
      console.error('❌ [RecordsContext] Error updating record:', error);
      throw error;
    }
  };

  const deleteRecord = async (recordId: string) => {
    try {
      setSyncStatus('syncing');
      console.log(`🗑️ [RecordsContext] Deleting record ${recordId}`);
      
      await LocalStorageService.deleteDailyRecord(recordId);
      await loadRecords(); // Refresh records
      
      console.log(`✅ [RecordsContext] Record deleted successfully`);
    } catch (error) {
      setSyncStatus('error');
      console.error('❌ [RecordsContext] Error deleting record:', error);
      throw error;
    }
  };

  const getRecordByDate = async (date: string): Promise<DailyRecord | null> => {
    try {
      console.log(`🔍 [RecordsContext] Searching record for ${date}`);
      
      // First try to find in loaded records
      const existingRecord = records.find(r => r.date === date);
      if (existingRecord) {
        console.log(`✅ [RecordsContext] Record found locally for ${date}`);
        return existingRecord;
      }
      
      // If not found, search in storage
      const storageRecord = await LocalStorageService.getDailyRecordByDate(date);
      if (storageRecord) {
        console.log(`✅ [RecordsContext] Record found in storage for ${date}`);
      } else {
        console.log(`ℹ️ [RecordsContext] No record found for ${date}`);
      }
      return storageRecord;
    } catch (error) {
      console.error('❌ [RecordsContext] Error getting record by date:', error);
      return null;
    }
  };

  const refreshRecords = async () => {
    console.log(`🔄 [RecordsContext] Manual refresh requested`);
    await loadRecords();
  };

  return (
    <RecordsContext.Provider
      value={{
        records,
        loading,
        error,
        syncStatus,
        createRecord,
        updateRecord,
        deleteRecord,
        getRecordByDate,
        refreshRecords,
      }}
    >
      {children}
    </RecordsContext.Provider>
  );
};

export const useRecords = () => {
  const context = useContext(RecordsContext);
  if (!context) {
    throw new Error('useRecords must be used within a RecordsProvider');
  }
  return context;
};