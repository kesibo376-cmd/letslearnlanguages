

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import type { Podcast, CompletionSound, Collection, StreakData, StreakDifficulty, Theme, LayoutMode, Language } from './types';
import { useTheme } from './hooks/useTheme';
import { useAuth } from './hooks/useAuth';
import { useUserData, getDefaultData } from './hooks/useUserData';
import { useStreak } from './hooks/useStreak';
import { v4 as uuidv4 } from 'uuid';
import * as db from './lib/db';
import { db as firestore } from './firebase';

import AppUI from './components/AppUI';
import AuthForm from './components/AuthForm';
import Confetti from './components/Confetti';
import { LanguageProvider } from './contexts/LanguageContext';
import OnboardingModal from './components/OnboardingModal';
import DebugOverlay from './components/DebugOverlay';
import { useDebug } from './contexts/DebugContext';

const COMPLETION_SOUND_URLS: Record<Exclude<CompletionSound, 'none' | 'random'>, string> = {
  minecraft: 'https://www.myinstants.com/media/sounds/levelup.mp3',
  pokemon: 'https://www.myinstants.com/media/sounds/12_3.mp3',
  runescape: 'https://www.myinstants.com/media/sounds/runescape-attack-level-up.mp3',
  otherday: 'https://www.myinstants.com/media/sounds/another-day-another-victory-for-da-og.mp3',
  'nice-shot': 'https://www.myinstants.com/media/sounds/nice-shot-wii-sports_2zyLCKo.mp3',
  qpuc: 'https://www.myinstants.com/media/sounds/generique-qpuc.mp3',
  reggie: 'https://www.myinstants.com/media/sounds/reggie-animal-crossing-3ds.mp3',
  'master-at-work': 'https://www.myinstants.com/media/sounds/you-are-watching-a-master-at-work.mp3',
  winnaar: 'https://www.myinstants.com/media/sounds/alweer-een-winnaar.mp3',
};

const LoadingSpinner = () => (
    <div className="flex items-center justify-center min-h-screen">
        <svg className="animate-spin h-10 w-10 text-brand-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
    </div>
);

export default function App() {
  const { user, logout, isLoading: isAuthLoading } = useAuth();
  const {
    data,
    updateUserData,
    podcasts,
    collections,
    title,
    theme,
    streakData,
    hideCompleted,
    reviewModeEnabled,
    completionSound,
    useCollectionsView,
    playOnNavigate,
    hasCompletedOnboarding,
    isDataLoading,
    totalStorageUsed,
    customArtwork,
    playerLayout,
    showPlaybackSpeedControl,
    lastPlayedCollectionId,
    language,
    status,
  } = useUserData(user?.uid);

  const [globalTheme, setGlobalTheme] = useTheme();

  useEffect(() => {
    if (theme) {
      setGlobalTheme(theme);
    }
  }, [theme, setGlobalTheme]);

  const { recordActivity, recordCompletion, unrecordCompletion, isTodayComplete, resetStreakProgress } = useStreak(streakData, updateUserData);

  const [currentPodcastId, setCurrentPodcastId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false); // For file uploads
  const [isPlayerExpanded, setIsPlayerExpanded] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const soundAudioRef = useRef<HTMLAudioElement>(null);
  const [reviewPrompt, setReviewPrompt] = useState<{ show: boolean; podcastToReview: Podcast | null; podcastToPlay: Podcast | null }>({ show: false, podcastToReview: null, podcastToPlay: null });
  const [nextPodcastOnEnd, setNextPodcastOnEnd] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [activePlayerTime, setActivePlayerTime] = useState(0);
  const [podcastsToCategorize, setPodcastsToCategorize] = useState<Podcast[]>([]);
  const [isCategorizeModalOpen, setIsCategorizeModalOpen] = useState(false);
  const [isCreateCollectionModalOpen, setIsCreateCollectionModalOpen] = useState(false);
  const [currentView, setCurrentView] = useState<string | null>(null);
  const [isClearDataModalOpen, setIsClearDataModalOpen] = useState(false);
  const [isAppReady, setIsAppReady] = useState(false);
  const [isMinLoadTimeMet, setIsMinLoadTimeMet] = useState(false);
  const [isDebugMode, setIsDebugMode] = useState(false);

  // --- NEW: Centralized Audio Control ---
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressUpdateDebounceRef = useRef<number | undefined>(undefined);
  // Fix: Explicitly pass undefined to useRef. While calling it with no arguments is valid, 
  // this is more explicit and avoids potential issues with specific toolchain versions that could cause the reported error.
  const audioSrcRef = useRef<string | undefined>(undefined);
  const { log } = useDebug();
  const [isPlaybackLoading, setIsPlaybackLoading] = useState(false);
  const [audioSrc, setAudioSrc] = useState<string | undefined>();
  const loadingTimeoutRef = useRef<number | null>(null);
  const podcastsRef = useRef(podcasts);
  
  useEffect(() => {
    podcastsRef.current = podcasts;
  }, [podcasts]);

  useEffect(() => {
    audioSrcRef.current = audioSrc;
  }, [audioSrc]);
  
  useEffect(() => {
    // Cleanup function to clear timeout on unmount
    return () => {
        if (loadingTimeoutRef.current) {
            clearTimeout(loadingTimeoutRef.current);
        }
    };
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('debug') === 'true') {
      setIsDebugMode(true);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsMinLoadTimeMet(true);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isAuthLoading && (!user || (user && !isDataLoading))) {
        setIsAppReady(true);
    }
  }, [isAuthLoading, user, isDataLoading]);

  useEffect(() => {
    const shouldLockScroll = isPlayerExpanded || isSettingsOpen || (user && !hasCompletedOnboarding) || isCategorizeModalOpen || isCreateCollectionModalOpen;
    document.body.style.overflow = shouldLockScroll ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isPlayerExpanded, isSettingsOpen, hasCompletedOnboarding, isCategorizeModalOpen, isCreateCollectionModalOpen, user]);

  const currentPodcast = useMemo(() =>
    podcasts.find(p => p.id === currentPodcastId),
    [podcasts, currentPodcastId]
  );
  
  const handleSetCustomArtwork = (url: string | null) => {
    if (!user) return;
    updateUserData({ customArtwork: url });
  };
  
  const handleSetStreakData = useCallback((newStreakData: StreakData) => {
    updateUserData({ streakData: newStreakData });
  }, [updateUserData]);

  const updatePodcastInState = (podcastId: string, updates: Partial<Podcast>) => {
    const currentPodcasts = data?.podcasts || [];
    const podcastIndex = currentPodcasts.findIndex(p => p.id === podcastId);
    if (podcastIndex > -1) {
        const newPodcasts = [...currentPodcasts];
        newPodcasts[podcastIndex] = { ...newPodcasts[podcastIndex], ...updates };
        updateUserData({ podcasts: newPodcasts });
    }
  }

  const updatePodcastProgress = useCallback((id: string, progress: number) => {
    if (streakData.enabled && streakData.difficulty === 'easy') {
      recordActivity();
    }
    
    const podcast = podcasts.find(p => p.id === id);
    if (!podcast) return;

    const isFinished = podcast.duration > 0 && progress >= podcast.duration - 1;
    let podcastWasCompleted = false;
    if (isFinished && !podcast.isListened) {
        podcastWasCompleted = true;
    }

    updatePodcastInState(id, { progress, isListened: podcast.isListened || isFinished });

    if (podcastWasCompleted && streakData.enabled && streakData.difficulty !== 'easy') {
      recordCompletion(id);
    }
  }, [podcasts, recordActivity, recordCompletion, streakData.enabled, streakData.difficulty, updateUserData]);

    const updatePodcastDuration = useCallback((id: string, duration: number) => {
    if (!isNaN(duration) && duration > 0) {
      const podcast = podcasts.find(p => p.id === id);
      if (podcast && podcast.duration === 0) {
        updatePodcastInState(id, { duration });
      }
    }
  }, [podcasts, updatePodcastInState]);

  const allPodcastsSorted = useMemo(() => {
    return [...podcasts].sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));
  }, [podcasts]);

  const podcastsInCurrentView = useMemo(() => {
    if (!useCollectionsView || !currentView) {
        return allPodcastsSorted;
    }
    return allPodcastsSorted.filter(p => (
        currentView === 'uncategorized' ? p.collectionId === null : p.collectionId === currentView
    ));
  }, [allPodcastsSorted, useCollectionsView, currentView]);

  const handleTogglePlayPause = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !currentPodcastId) return;
    if (audio.paused) {
      audio.play().catch(e => log(`[Player Error] Playback error: ${e.message}`));
    } else {
      audio.pause();
    }
  }, [log, currentPodcastId]);

  const startLoadingNewTrack = useCallback((trackId: string) => {
      log(`[App] startLoadingNewTrack called for id: ${trackId}`);
      if (audioRef.current) audioRef.current.pause();
      
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }

      setIsPlaying(false);
      setIsPlaybackLoading(true);
      setCurrentPodcastId(trackId);
      
      const selectedPodcast = podcasts.find(p => p.id === trackId);
      setActivePlayerTime(selectedPodcast?.progress || 0);

      if (!isPlayerExpanded) setIsPlayerExpanded(true);
      
      loadingTimeoutRef.current = window.setTimeout(() => {
          log('[Player Timeout] Audio loading timed out after 15 seconds.');
          if (audioRef.current) {
            audioRef.current.src = ''; // Stop any potential background loading
          }
          setIsPlaybackLoading(false); // Hide spinner
          setCurrentPodcastId(null);   // Reset player state
          setIsPlayerExpanded(false);
          alert("The audio file took too long to load. Please check your connection and try again.");
      }, 15000);

  }, [podcasts, isPlayerExpanded, log]);

  const handleSelectPodcast = useCallback((id: string) => {
    log(`[App] handleSelectPodcast called for id: ${id}`);
    if (id === currentPodcastId) {
        handleTogglePlayPause();
    } else {
        const selectedPodcast = podcasts.find(p => p.id === id);
        if (!selectedPodcast) return;
        
        const previouslyListened = allPodcastsSorted.filter(p => p.isListened && p.id !== id);
        const lastListened = previouslyListened[previouslyListened.length - 1];

        if (reviewModeEnabled && lastListened) {
            setReviewPrompt({ show: true, podcastToReview: lastListened, podcastToPlay: selectedPodcast });
        } else {
            startLoadingNewTrack(id);
        }
    }
  }, [currentPodcastId, podcasts, allPodcastsSorted, reviewModeEnabled, handleTogglePlayPause, setReviewPrompt, startLoadingNewTrack]);

  // Effect to load audio source when currentPodcastId changes
  useEffect(() => {
    if (!currentPodcastId) {
      if(audioRef.current) audioRef.current.src = '';
      setAudioSrc(undefined);
      return;
    }

    const loadAudioSource = async () => {
      const audio = audioRef.current;
      if (!audio) return;

      const podcastToPlay = podcastsRef.current.find(p => p.id === currentPodcastId);
      if (!podcastToPlay) {
        log(`[App Error] Selected podcast with id ${currentPodcastId} not found in loadAudioSource.`);
        setIsPlaybackLoading(false);
        return;
      }

      log(`[App Loader] Starting to load audio for ${podcastToPlay.name}`);

      if (audioSrcRef.current && audioSrcRef.current.startsWith('blob:')) {
        log(`[App Loader] Revoking old object URL: ${audioSrcRef.current}`);
        URL.revokeObjectURL(audioSrcRef.current);
      }

      let newSrc: string | undefined;
      if (podcastToPlay.storage === 'indexeddb') {
        try {
          log(`[App Loader] Getting audio from IndexedDB for id: ${currentPodcastId}`);
          const blob = await db.getAudio(currentPodcastId);
          if (blob) {
            newSrc = URL.createObjectURL(blob);
            log(`[App Loader] Created new object URL: ${newSrc}`);
          } else {
            throw new Error('Blob not found in IndexedDB.');
          }
        } catch (error) {
          log(`[App Error] Failed to load from IndexedDB: ${error}`);
          alert("Could not load audio file. It may have been deleted.");
          setIsPlaybackLoading(false);
          setCurrentPodcastId(null);
          return;
        }
      } else {
        newSrc = podcastToPlay.url;
        log(`[App Loader] Using preloaded URL: ${newSrc}`);
      }

      setAudioSrc(newSrc);
      audio.src = newSrc || '';
    };
    
    loadAudioSource();
  }, [currentPodcastId, log, setCurrentPodcastId]);


  const handlePlaybackEnd = () => {
    if (isPlayerExpanded) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 5000);
    }
  
    if (completionSound !== 'none') {
      let soundUrl: string | undefined;
  
      if (completionSound === 'random') {
        const soundKeys = Object.keys(COMPLETION_SOUND_URLS) as (keyof typeof COMPLETION_SOUND_URLS)[];
        if (soundKeys.length > 0) {
          const randomKey = soundKeys[Math.floor(Math.random() * soundKeys.length)];
          soundUrl = COMPLETION_SOUND_URLS[randomKey];
        }
      } else {
        soundUrl = COMPLETION_SOUND_URLS[completionSound];
      }
  
      if (soundUrl && soundAudioRef.current) {
        soundAudioRef.current.src = soundUrl;
        soundAudioRef.current.play().catch(e => console.error("Error playing completion sound:", e));
      }
    }
  
    if (currentPodcastId) {
      updatePodcastInState(currentPodcastId, { isListened: true, progress: 0 });
      setActivePlayerTime(0);
    } else {
      setIsPlaying(false);
      return;
    }
  
    if (nextPodcastOnEnd) {
      startLoadingNewTrack(nextPodcastOnEnd);
      setNextPodcastOnEnd(null);
      return;
    }
  
    const currentIndex = podcastsInCurrentView.findIndex(p => p.id === currentPodcastId);
  
    if (currentIndex > -1 && currentIndex < podcastsInCurrentView.length - 1) {
      const nextPodcast = podcastsInCurrentView[currentIndex + 1];
      if (nextPodcast) {
        startLoadingNewTrack(nextPodcast.id);
      } else {
        setIsPlaying(false);
      }
    } else {
      setIsPlaying(false);
    }
  };
  
  const handleOnboardingComplete = () => {
    updateUserData({ hasCompletedOnboarding: true });
  };
  
  const handleImportData = useCallback((file: File, onSuccess?: () => void) => {
      const reader = new FileReader();
      reader.onload = (event) => {
          try {
              const result = event.target?.result;
              if (typeof result !== 'string') throw new Error("File read error");
              const importedData = JSON.parse(result);
              
              const { podcasts, collections, ...settings } = importedData;
              
              updateUserData(settings);

              alert('Settings imported successfully! Note: Audio files and collections are managed in the cloud and not part of the import.');
              onSuccess?.();

          } catch (error) {
              alert(`Error importing file: ${error instanceof Error ? error.message : "Unknown error"}`);
          }
      };
      reader.readAsText(file);
  }, [updateUserData]);

  const handleFileUpload = useCallback(async (files: FileList) => {
    if (!user) return;
    setIsLoading(true);

    const newPodcasts: Podcast[] = [];

    for (const file of Array.from(files)) {
      if (!file.type.startsWith('audio/')) {
        console.warn(`Skipping non-audio file: ${file.name}`);
        continue;
      }

      const id = uuidv4();
      
      try {
        await db.saveAudio(id, file);

        const duration = await new Promise<number>((resolve) => {
          const audio = document.createElement('audio');
          audio.src = URL.createObjectURL(file);
          audio.onloadedmetadata = () => {
            URL.revokeObjectURL(audio.src);
            resolve(audio.duration);
          };
          audio.onerror = () => {
            URL.revokeObjectURL(audio.src);
            resolve(0);
          }
        });

        newPodcasts.push({
          id,
          name: file.name.replace(/\.[^/.]+$/, ""),
          url: '',
          duration,
          progress: 0,
          isListened: false,
          storage: 'indexeddb',
          collectionId: null,
          size: file.size,
        });
      } catch (error) {
        console.error("Error saving file to IndexedDB:", error);
        alert(`Failed to save ${file.name} locally. Please try again.`);
      }
    }

    if (newPodcasts.length > 0) {
      const updatedPodcasts = [...podcasts, ...newPodcasts];
      updateUserData({ podcasts: updatedPodcasts });
      
      if (collections.length > 0 && useCollectionsView) {
        setPodcastsToCategorize(newPodcasts);
        setIsCategorizeModalOpen(true);
      }
    }

    setIsLoading(false);
  }, [user, podcasts, collections.length, useCollectionsView, updateUserData]);
  
  const handleDeletePodcast = useCallback(async (id: string) => {
    if (!user) return;
    
    if (currentPodcastId === id) {
        if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = ''; }
        setIsPlaying(false);
        setCurrentPodcastId(null);
        setIsPlayerExpanded(false);
    }
    
    const podcastToDelete = podcasts.find(p => p.id === id);
    if (!podcastToDelete) return;
    
    if (podcastToDelete.storage === 'indexeddb') {
        try {
            await db.deleteAudio(id);
        } catch (error) {
            console.error("Error deleting from IndexedDB:", error);
            alert("Error deleting local file. Please try again.");
            return;
        }
    }

    const updatedPodcasts = podcasts.filter(p => p.id !== id);
    updateUserData({ podcasts: updatedPodcasts });

  }, [user, currentPodcastId, podcasts, updateUserData]);

  const handleDeleteCollection = useCallback(async (id: string) => {
    if (!user) return;

    const podcastsToDelete = podcasts.filter((p: Podcast) => p.collectionId === id);
    const podcastIdsToDelete = new Set(podcastsToDelete.map((p: Podcast) => p.id));

    if (currentPodcastId && podcastIdsToDelete.has(currentPodcastId)) {
        if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = ''; }
        setIsPlaying(false);
        setCurrentPodcastId(null);
        setIsPlayerExpanded(false);
    }

    for (const podcast of podcastsToDelete) {
        if (podcast.storage === 'indexeddb') {
            try {
                await db.deleteAudio(podcast.id);
            } catch (error) {
                console.error(`Failed to delete local audio ${podcast.name}:`, error);
            }
        }
    }

    const updatedPodcasts = podcasts.filter((p: Podcast) => p.collectionId !== id);
    const updatedCollections = collections.filter((c: Collection) => c.id !== id);

    updateUserData({
        podcasts: updatedPodcasts,
        collections: updatedCollections,
    });
  }, [user, podcasts, collections, currentPodcastId, updateUserData, setIsPlaying, setIsPlayerExpanded]);
  
  const handleResetProgress = () => {
    const resetPodcasts = podcasts.map(p => ({...p, progress: 0, isListened: false}));
    updateUserData({ podcasts: resetPodcasts });
    resetStreakProgress();
  };

  const handleClearLocalFiles = async () => {
    if (!user) return;
    if (window.confirm("This will delete all your uploaded audio from this device. Are you sure?")) {
        setIsLoading(true);
        if (currentPodcastId && podcasts.find(p => p.id === currentPodcastId)?.storage === 'indexeddb') {
            if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = ''; }
            setIsPlaying(false);
            setCurrentPodcastId(null);
            setIsPlayerExpanded(false);
        }

        const localPodcasts = podcasts.filter((p: Podcast) => p.storage === 'indexeddb');
        for (const podcast of localPodcasts) {
            try {
                await db.deleteAudio(podcast.id);
            } catch (error) {
                console.error(`Failed to delete ${podcast.name} from IndexedDB:`, error);
            }
        }
        
        const preloadedOnly = podcasts.filter((p: Podcast) => p.storage !== 'indexeddb');
        updateUserData({ podcasts: preloadedOnly });
        setIsClearDataModalOpen(false);
        setIsLoading(false);
    }
  };

  const handleResetPreloaded = () => {
    const updatedPodcasts = podcasts.map(p => p.storage === 'preloaded' ? {...p, progress: 0, isListened: false} : p);
    updateUserData({ podcasts: updatedPodcasts });
    setIsClearDataModalOpen(false);
  };
  
  const handleClearAll = async () => {
     if (!user) return;
     if (window.confirm("DANGER: This will delete ALL your uploaded files from this device and reset ALL settings. This cannot be undone. Are you absolutely sure?")) {
        setIsLoading(true);
        
        const localPodcasts = podcasts.filter((p: Podcast) => p.storage === 'indexeddb');
        for (const podcast of localPodcasts) {
             try {
                await db.deleteAudio(podcast.id);
            } catch (error) { console.error(`Failed to delete ${podcast.name}:`, error); }
        }
        
        updateUserData(null); 

        if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = ''; }
        setIsPlaying(false);
        setCurrentPodcastId(null);
        setIsClearDataModalOpen(false);
        setIsLoading(false);
     }
  };
  
  const handleUpdatePreloadedData = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);

    const defaultData = getDefaultData();
    const defaultPreloadedPodcasts = defaultData.podcasts.filter((p: Podcast) => p.storage === 'preloaded');
    const defaultPreloadedCollections = defaultData.collections;
    
    const existingCollectionIds = new Set(collections.map((c: Collection) => c.id));
    const missingCollections = defaultPreloadedCollections.filter((c: Collection) => !existingCollectionIds.has(c.id));

    // To prevent duplication with legacy data, we identify preloaded podcasts by URL
    // even if they are missing the `storage` property from their data model.
    const R2_DEV_HOST = 'pub-601404c314b24f2bb21b0d97c7cd0dfa.r2.dev';
    const existingPreloadedPodcastUrls = new Set(
      podcasts
        .filter((p: Podcast) => 
            p.storage === 'preloaded' || 
            (!(p as any).storage && p.url && p.url.includes(R2_DEV_HOST))
        )
        .map(p => p.url)
    );
    
    const missingPodcasts = defaultPreloadedPodcasts.filter(p => !existingPreloadedPodcastUrls.has(p.url));

    if (missingCollections.length === 0 && missingPodcasts.length === 0) {
        alert("Your preloaded content is already up-to-date.");
        setIsLoading(false);
        return;
    }

    // Perform a one-time data migration for any existing podcasts that are missing the `storage` property.
    const podcastsWithStorageFixed = podcasts.map((p: Podcast) => {
        if ((p as any).storage) {
            return p; // Already has storage property, no change needed.
        }
        // If storage is missing, determine what it should be.
        if (p.url && p.url.includes(R2_DEV_HOST)) {
            return { ...p, storage: 'preloaded' as const };
        }
        // Assume anything else is a local file.
        return { ...p, storage: 'indexeddb' as const };
    });

    const updatedCollections = [...collections, ...missingCollections];
    const updatedPodcasts = [...podcastsWithStorageFixed, ...missingPodcasts];

    try {
        await updateUserData({
            collections: updatedCollections,
            podcasts: updatedPodcasts
        });
        alert(`Successfully added ${missingCollections.length} new collection(s) and ${missingPodcasts.length} new audio file(s). Your library is now up to date.`);
    } catch (error) {
        console.error("Failed to update preloaded data:", error);
        alert("An error occurred while updating. Please try again.");
    } finally {
        setIsLoading(false);
    }
  }, [user, podcasts, collections, updateUserData]);

    // --- NEW: Audio Control Functions ---
  const handleSkip = useCallback((seconds: number) => {
    const audio = audioRef.current;
    if (!audio || !currentPodcast) return;
    const newTime = Math.max(0, Math.min(currentPodcast.duration || 0, audio.currentTime + seconds));
    audio.currentTime = newTime;
    setActivePlayerTime(newTime);
    if (progressUpdateDebounceRef.current) clearTimeout(progressUpdateDebounceRef.current);
    updatePodcastProgress(currentPodcast.id, newTime);
  }, [currentPodcast, updatePodcastProgress]);
  
  const handleSeek = useCallback((newTime: number) => {
    const audio = audioRef.current;
    if (!audio || !currentPodcast) return;
    audio.currentTime = newTime;
    setActivePlayerTime(newTime);
    if (progressUpdateDebounceRef.current) clearTimeout(progressUpdateDebounceRef.current);
    updatePodcastProgress(currentPodcast.id, newTime);
  }, [currentPodcast, updatePodcastProgress]);

  // --- NEW: Audio Event Handlers ---
  const handleAudioPlay = useCallback(() => { log('[Player Event] onPlay'); setIsPlaying(true); }, [log, setIsPlaying]);
  const handleAudioPause = useCallback(() => { log('[Player Event] onPause'); setIsPlaying(false); }, [log, setIsPlaying]);
  
  const handleCanPlay = useCallback(() => {
    log('[Player Event] onCanPlay.');
    if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
    }
    setIsPlaybackLoading(false);
  }, [log]);
  
  const handleWaiting = useCallback(() => { log('[Player Event] onWaiting (buffering).'); setIsPlaybackLoading(true); }, [log]);
  const handlePlaying = useCallback(() => { log('[Player Event] onPlaying.'); setIsPlaybackLoading(false); }, [log]);
  
  const handleTimeUpdate = useCallback(() => {
    if (!audioRef.current || !currentPodcastId) return;
    const currentTime = audioRef.current.currentTime;
    setActivePlayerTime(currentTime);

    if (progressUpdateDebounceRef.current) clearTimeout(progressUpdateDebounceRef.current);
    progressUpdateDebounceRef.current = window.setTimeout(() => {
      if(currentPodcastId) {
        updatePodcastProgress(currentPodcastId, currentTime);
      }
    }, 1000);
  }, [currentPodcastId, updatePodcastProgress, setActivePlayerTime]);

  const handleLoadedMetadata = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !currentPodcast) return;
    log(`[Player Event] onLoadedMetadata. Duration: ${audio.duration}`);
    if (isFinite(currentPodcast.progress) && audio.currentTime !== currentPodcast.progress) {
        audio.currentTime = currentPodcast.progress;
        setActivePlayerTime(currentPodcast.progress);
    }
    if (!currentPodcast.duration || currentPodcast.duration === 0) {
        updatePodcastDuration(currentPodcast.id, audio.duration);
    }
  }, [currentPodcast, log, updatePodcastDuration, setActivePlayerTime]);

  const handleAudioEnded = useCallback(() => {
    log(`[Player Event] onEnded for "${currentPodcast?.name}"`);
    if (progressUpdateDebounceRef.current) clearTimeout(progressUpdateDebounceRef.current);
    if (currentPodcast && currentPodcast.duration > 0) {
        updatePodcastProgress(currentPodcast.id, currentPodcast.duration);
    }
    handlePlaybackEnd();
  }, [currentPodcast, updatePodcastProgress, handlePlaybackEnd, log]);
  
  const handleAudioError = useCallback((e: React.SyntheticEvent<HTMLAudioElement, Event>) => {
    if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
    }
    const audio = e.currentTarget;
    const error = audio.error;
    if (error) {
        log(`[Player Error] Code: ${error.code}, Message: ${error.message}`);
        alert(`Error playing audio: ${error.message} (Code: ${error.code})`);
    }
    setIsPlaybackLoading(false);
    setIsPlaying(false);
  }, [log, setIsPlaying]);

  useEffect(() => {
    if(audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  if (!isAppReady || !isMinLoadTimeMet) {
    return <LoadingSpinner />;
  }
  
  if (!user) {
    return (
      <LanguageProvider language={'en'}>
        <div className="text-brand-text min-h-screen">
            <AuthForm />
        </div>
      </LanguageProvider>
    );
  }

  if (status && user.email !== 'maxence.poskin@gmail.com') {
    if (status === 'pending') {
      return ( <LanguageProvider language={language || 'en'}><div className="text-brand-text min-h-screen flex items-center justify-center p-4"><div className="text-center bg-brand-surface p-8 rounded-lg b-border b-shadow max-w-md"><h1 className="text-2xl font-bold mb-4">Approval Pending</h1><p className="text-brand-text-secondary">Your account is awaiting approval from an administrator. You will be able to access the app once your request has been reviewed. Thank you for your patience.</p><button onClick={logout} className="mt-6 px-4 py-2 bg-brand-primary text-brand-text-on-primary rounded-md b-border b-shadow hover:bg-brand-primary-hover">Logout</button></div></div></LanguageProvider> );
    }
    if (status === 'denied') {
      return ( <LanguageProvider language={language || 'en'}><div className="text-brand-text min-h-screen flex items-center justify-center p-4"><div className="text-center bg-brand-surface p-8 rounded-lg b-border b-shadow max-w-md"><h1 className="text-2xl font-bold mb-4">Access Denied</h1><p className="text-brand-text-secondary">Your account request has been denied. If you believe this is a mistake, please contact support.</p><button onClick={logout} className="mt-6 px-4 py-2 bg-brand-primary text-brand-text-on-primary rounded-md b-border b-shadow hover:bg-brand-primary-hover">Logout</button></div></div></LanguageProvider> );
    }
  }
  
  if (!hasCompletedOnboarding) {
    return (
      <LanguageProvider language={language || 'en'}>
        <div className="text-brand-text min-h-screen animate-fade-in">
          <OnboardingModal isOpen={true} onComplete={handleOnboardingComplete} onImportData={(file) => handleImportData(file, handleOnboardingComplete)} />
        </div>
      </LanguageProvider>
    );
  }

  return (
    <LanguageProvider language={language || 'en'}>
        <div className="text-brand-text min-h-screen animate-fade-in">
        {isDebugMode && <DebugOverlay />}
        <audio ref={soundAudioRef} preload="auto" />
        <audio
          ref={audioRef}
          onPlay={handleAudioPlay}
          onPause={handleAudioPause}
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleAudioEnded}
          onLoadedMetadata={handleLoadedMetadata}
          onCanPlay={handleCanPlay}
          onWaiting={handleWaiting}
          onPlaying={handlePlaying}
          onError={handleAudioError}
          preload="auto"
        />
        {showConfetti && <Confetti count={50} theme={theme} />}

        <AppUI
            user={user}
            onLogout={logout}
            onImportData={handleImportData}
            podcasts={podcasts}
            collections={collections}
            title={title}
            setTitle={(newTitle: string) => updateUserData({ title: newTitle })}
            streakData={streakData}
            isTodayComplete={isTodayComplete}
            currentPodcastId={currentPodcastId}
            currentPodcast={currentPodcast}
            isPlaying={isPlaying}
            isPlayerExpanded={isPlayerExpanded}
            setIsPlayerExpanded={setIsPlayerExpanded}
            customArtwork={customArtwork}
            playbackRate={playbackRate}
            setPlaybackRate={setPlaybackRate}
            activePlayerTime={activePlayerTime}
            isSettingsOpen={isSettingsOpen}
            setIsSettingsOpen={setIsSettingsOpen}
            hideCompleted={hideCompleted}
            setHideCompleted={(value: boolean) => updateUserData({ hideCompleted: value })}
            reviewModeEnabled={reviewModeEnabled}
            setReviewModeEnabled={(value: boolean) => updateUserData({ reviewModeEnabled: value })}
            completionSound={completionSound}
            setCompletionSound={(sound: CompletionSound) => updateUserData({ completionSound: sound })}
            useCollectionsView={useCollectionsView}
            setUseCollectionsView={(value: boolean) => updateUserData({ useCollectionsView: value })}
            playOnNavigate={playOnNavigate}
            setPlayOnNavigate={(value: boolean) => updateUserData({ playOnNavigate: value })}
            playerLayout={playerLayout}
            setPlayerLayout={(layout: LayoutMode) => updateUserData({ playerLayout: layout })}
            lastPlayedCollectionId={lastPlayedCollectionId}
            setLastPlayedCollectionId={(id: string | null) => updateUserData({ lastPlayedCollectionId: id })}
            handleSetCustomArtwork={handleSetCustomArtwork}
            dataToExport={data}
            theme={theme}
            setTheme={(newTheme: Theme) => updateUserData({ theme: newTheme })}
            setLanguage={(lang: Language) => updateUserData({ language: lang })}
            setStreakData={handleSetStreakData}
            setPodcasts={(newPodcasts: Podcast[]) => updateUserData({ podcasts: newPodcasts })}
            setCollections={(newCollections: Collection[]) => updateUserData({ collections: newCollections })}
            unrecordCompletion={unrecordCompletion}
            recordCompletion={recordCompletion}
            allPodcastsSorted={allPodcastsSorted}
            podcastsInCurrentView={podcastsInCurrentView}
            reviewPrompt={reviewPrompt}
            setReviewPrompt={setReviewPrompt}
            setNextPodcastOnEnd={setNextPodcastOnEnd}
            isCategorizeModalOpen={isCategorizeModalOpen}
            setIsCategorizeModalOpen={setIsCategorizeModalOpen}
            podcastsToCategorize={podcastsToCategorize}
            setPodcastsToCategorize={setPodcastsToCategorize}
            isCreateCollectionModalOpen={isCreateCollectionModalOpen}
            setIsCreateCollectionModalOpen={setIsCreateCollectionModalOpen}
            currentView={currentView}
            setCurrentView={setCurrentView}
            isClearDataModalOpen={isClearDataModalOpen}
            setIsClearDataModalOpen={setIsClearDataModalOpen}
            isLoading={isLoading}
            isPlaybackLoading={isPlaybackLoading}
            onFileUpload={handleFileUpload}
            onDeletePodcast={handleDeletePodcast}
            onDeleteCollection={handleDeleteCollection}
            // Fix: Corrected prop names to match the handler functions defined in this component.
            onResetProgress={handleResetProgress}
            onClearLocalFiles={handleClearLocalFiles}
            onResetPreloaded={handleResetPreloaded}
            onClearAll={handleClearAll}
            onUpdatePreloadedData={handleUpdatePreloadedData}
            totalStorageUsed={totalStorageUsed}
            onSelectPodcast={handleSelectPodcast}
            onTogglePlayPause={handleTogglePlayPause}
            onSkip={handleSkip}
            onSeek={handleSeek}
            showPlaybackSpeedControl={showPlaybackSpeedControl}
            setShowPlaybackSpeedControl={(value: boolean) => updateUserData({showPlaybackSpeedControl: value})}
        />
      </div>
    </LanguageProvider>
  );
}