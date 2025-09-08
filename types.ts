export interface Podcast {
  id: string;
  name: string;
  url: string; 
  duration: number; // in seconds
  progress: number; // in seconds
  isListened: boolean;
  storage: 'preloaded' | 'indexeddb';
  collectionId: string | null;
  size?: number; // file size in bytes
}

export interface Collection {
  id: string;
  name:string;
  artworkUrl?: string;
}

export type Theme = 'charcoal' | 'minecraft' | 'brutalist' | 'retro-web' | 'minimal' | 'cyber-brutalist';

export type StreakDifficulty = 'easy' | 'normal' | 'hard' | 'extreme';

export interface StreakData {
  enabled: boolean;
  lastListenDate: string | null; // ISO Date String: YYYY-MM-DD
  currentStreak: number;
  difficulty: StreakDifficulty;
  completionDate: string | null; // ISO Date for the completedToday list
  completedToday: string[]; // Array of podcast IDs completed on completionDate
  history: string[]; // Array of ISO Date strings for completed days
}

export type CompletionSound = 'none' | 'minecraft' | 'pokemon' | 'runescape' | 'otherday' | 'random' | 'nice-shot' | 'qpuc' | 'reggie' | 'master-at-work' | 'winnaar';

// This interface now matches the structure of the Firebase User object
export interface User {
  uid: string;
  email: string | null;
}

// Fix: Export LayoutMode type for player component
export type LayoutMode = 'default' | 'pimsleur';

export type Language = 'en' | 'zh';