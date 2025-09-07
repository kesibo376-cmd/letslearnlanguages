import { useCallback, useMemo } from 'react';
import type { StreakData, StreakDifficulty } from '../types';

// Helper to get date string in YYYY-MM-DD format for a consistent timezone (Paris)
const getParisDate = (date: Date): string => {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Paris' }).format(date);
};

const getTodayDateString = (): string => getParisDate(new Date());

const getYesterdayDateString = (): string => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return getParisDate(yesterday);
};

// Map difficulty to the number of completions required
const GOALS: Record<Exclude<StreakDifficulty, 'easy'>, number> = {
  normal: 1,
  hard: 2,
  extreme: 3,
};

export const useStreak = (
  streakData: StreakData,
  updateUserData: (updates: Partial<{ streakData: StreakData }>) => void
) => {
  const today = useMemo(() => getTodayDateString(), []);

  const isTodayComplete = useMemo(() => {
    if (!streakData.enabled) return false;
    // Check if today's date string is in the history array.
    return streakData.history?.includes(today) ?? false;
  }, [streakData.enabled, streakData.history, today]);

  const recordCompletion = useCallback((podcastId: string) => {
    if (!streakData.enabled || streakData.difficulty === 'easy') return;

    const currentCompletionDate = streakData.completionDate;
    const completedTodayList = (currentCompletionDate === today && Array.isArray(streakData.completedToday)) ? [...streakData.completedToday] : [];

    if (completedTodayList.includes(podcastId)) return; // Already recorded

    const newCompletedToday = [...completedTodayList, podcastId];
    
    const goal = GOALS[streakData.difficulty];
    const wasComplete = (streakData.history || []).includes(today);
    const isNowComplete = newCompletedToday.length >= goal;

    let newStreakData: StreakData = { ...streakData, completedToday: newCompletedToday, completionDate: today };

    if (isNowComplete && !wasComplete) {
      // Day is now complete, update streak
      const yesterday = getYesterdayDateString();
      const newStreak = streakData.lastListenDate === yesterday ? streakData.currentStreak + 1 : 1;
      // Ensure history is an array and add today without duplicates
      const newHistory = [...(streakData.history?.filter(d => d !== today) || []), today];
      
      newStreakData = {
        ...newStreakData,
        currentStreak: newStreak,
        lastListenDate: today,
        history: newHistory,
      };
    }

    updateUserData({ streakData: newStreakData });
  }, [streakData, updateUserData, today]);

  const unrecordCompletion = useCallback((podcastId: string) => {
    if (!streakData.enabled || streakData.difficulty === 'easy' || streakData.completionDate !== today) return;

    const completedTodayList = streakData.completedToday || [];
    if (!completedTodayList.includes(podcastId)) return; // Not in the list

    const newCompletedToday = completedTodayList.filter(id => id !== podcastId);

    const goal = GOALS[streakData.difficulty];
    const wasComplete = (streakData.history || []).includes(today);
    const isNowComplete = newCompletedToday.length >= goal;

    let newStreakData: StreakData = { ...streakData, completedToday: newCompletedToday };
    
    if (wasComplete && !isNowComplete) {
      // Day is no longer complete, revert streak
      const previousHistory = streakData.history?.filter(d => d !== today) || [];
      const lastCompletedDay = previousHistory.length > 0 ? previousHistory[previousHistory.length - 1] : null;

      // Only decrement streak if the last listen date was today
      const newStreak = streakData.lastListenDate === today ? Math.max(0, streakData.currentStreak - 1) : streakData.currentStreak;

      newStreakData = {
        ...newStreakData,
        // If last listen date was today, revert it to the last day in history
        lastListenDate: streakData.lastListenDate === today ? lastCompletedDay : streakData.lastListenDate,
        currentStreak: newStreak,
        history: previousHistory,
      };
    }
    
    updateUserData({ streakData: newStreakData });
  }, [streakData, updateUserData, today]);
  
  const recordActivity = useCallback(() => {
    // This is for 'easy' mode
    if (!streakData.enabled || streakData.difficulty !== 'easy') return;
    
    // Check if today is already in history to avoid re-processing
    if ((streakData.history || []).includes(today)) return;
    
    const yesterday = getYesterdayDateString();
    const newStreak = streakData.lastListenDate === yesterday ? streakData.currentStreak + 1 : 1;
    const newHistory = [...(streakData.history || []), today];
    
    updateUserData({
      streakData: {
        ...streakData,
        currentStreak: newStreak,
        lastListenDate: today,
        history: newHistory,
        // Also update completion fields for consistency, though not strictly used by 'easy' logic
        completionDate: today,
        completedToday: streakData.completedToday || [],
      }
    });
  }, [streakData, updateUserData, today]);
  
  const resetStreakProgress = useCallback(() => {
      updateUserData({
          streakData: {
              ...streakData,
              currentStreak: 0,
              lastListenDate: null,
              completionDate: null,
              completedToday: [],
              history: [],
          }
      });
  }, [streakData, updateUserData]);

  return { recordActivity, recordCompletion, unrecordCompletion, isTodayComplete, resetStreakProgress };
};
