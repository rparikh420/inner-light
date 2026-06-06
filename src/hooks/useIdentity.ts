import React, { useState, useEffect, useCallback, useContext, createContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  IDENTITY: '@inner_light/identity',
  STREAK: '@inner_light/streak',
  STREAK_DATE: '@inner_light/streak_date',
  JOURNAL: '@inner_light/journal_entries',
} as const;

export interface UserIdentity {
  name: string;
  intention: string;
  goals: string[];
  createdAt: string;
}

export interface JournalEntry {
  id: string;
  date: string;
  promptId: number;
  response: string;
}

interface IdentityContextValue {
  identity: UserIdentity | null;
  isOnboarded: boolean;
  loading: boolean;
  saveIdentity: (identity: UserIdentity) => Promise<void>;
  getStreak: () => Promise<number>;
  incrementStreak: () => Promise<number>;
  saveJournalEntry: (entry: JournalEntry) => Promise<void>;
  getJournalEntries: () => Promise<JournalEntry[]>;
}

const IdentityContext = createContext<IdentityContextValue | null>(null);

export function IdentityProvider({ children }: { children: React.ReactNode }) {
  const [identity, setIdentity] = useState<UserIdentity | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadIdentity = async () => {
      try {
        const stored = await AsyncStorage.getItem(KEYS.IDENTITY);
        if (mounted && stored) {
          setIdentity(JSON.parse(stored));
        }
      } catch (error) {
        console.error('Failed to load identity:', error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadIdentity();

    return () => {
      mounted = false;
    };
  }, []);

  const saveIdentity = useCallback(async (newIdentity: UserIdentity) => {
    try {
      await AsyncStorage.setItem(KEYS.IDENTITY, JSON.stringify(newIdentity));
      setIdentity(newIdentity);
    } catch (error) {
      console.error('Failed to save identity:', error);
      throw error;
    }
  }, []);

  const getStreak = useCallback(async (): Promise<number> => {
    try {
      const streak = await AsyncStorage.getItem(KEYS.STREAK);
      return streak ? parseInt(streak, 10) : 0;
    } catch (error) {
      console.error('Failed to get streak:', error);
      return 0;
    }
  }, []);

  const incrementStreak = useCallback(async (): Promise<number> => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const lastDate = await AsyncStorage.getItem(KEYS.STREAK_DATE);

      if (lastDate === today) {
        const current = await AsyncStorage.getItem(KEYS.STREAK);
        return current ? parseInt(current, 10) : 0;
      }

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      let currentStreak = 0;
      if (lastDate === yesterdayStr) {
        const stored = await AsyncStorage.getItem(KEYS.STREAK);
        currentStreak = stored ? parseInt(stored, 10) : 0;
      }

      const newStreak = currentStreak + 1;
      await AsyncStorage.multiSet([
        [KEYS.STREAK, newStreak.toString()],
        [KEYS.STREAK_DATE, today],
      ]);

      return newStreak;
    } catch (error) {
      console.error('Failed to increment streak:', error);
      return 0;
    }
  }, []);

  const saveJournalEntry = useCallback(async (entry: JournalEntry) => {
    try {
      const stored = await AsyncStorage.getItem(KEYS.JOURNAL);
      const entries: JournalEntry[] = stored ? JSON.parse(stored) : [];
      entries.push(entry);
      await AsyncStorage.setItem(KEYS.JOURNAL, JSON.stringify(entries));
    } catch (error) {
      console.error('Failed to save journal entry:', error);
      throw error;
    }
  }, []);

  const getJournalEntries = useCallback(async (): Promise<JournalEntry[]> => {
    try {
      const stored = await AsyncStorage.getItem(KEYS.JOURNAL);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to get journal entries:', error);
      return [];
    }
  }, []);

  const value: IdentityContextValue = {
    identity,
    isOnboarded: identity !== null,
    loading,
    saveIdentity,
    getStreak,
    incrementStreak,
    saveJournalEntry,
    getJournalEntries,
  };

  return React.createElement(IdentityContext.Provider, { value }, children);
}

export function useIdentity(): IdentityContextValue {
  const context = useContext(IdentityContext);
  if (!context) {
    throw new Error('useIdentity must be used within an IdentityProvider');
  }
  return context;
}
