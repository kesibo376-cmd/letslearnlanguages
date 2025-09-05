
import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import type { Podcast, CompletionSound, Collection, StreakData, StreakDifficulty, Theme, LayoutMode } from './types';
import { useTheme } from './hooks/useTheme';
import { useAuth } from './hooks/useAuth';
import { useUserData } from './hooks/useUserData';
import { v4 as uuidv4 } from 'uuid';
import * as db from './lib/db';

import Player from './components/Player';
import AuthForm from './components/AuthForm';
import AppUI from './components/AppUI';
import Confetti from './components/Confetti';

const COMPLETION_SOUND_URLS: Record<Exclude<CompletionSound, 'none'>, string> = {
  minecraft: 'https://www.myinstants.com/media/sounds/levelup.mp3',
  pokemon: 'https://www.myinstants.com/media/sounds/12_3.mp3',
  runescape: 'https://www.myinstants.com/media/sounds/runescape-attack-level-up.mp3',
  otherday: 'https://www.myinstants.com/media/sounds/another-day-another-victory-for-da-og.mp3',
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
    lastPlayedCollectionId,
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
  const [isLoading, setIsLoading] = useState<boolean>(false);
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

  // Effect to lock body scroll when modals are open
  useEffect(() => {
    const shouldLockScroll = isPlayerExpanded || isSettingsOpen || (user && !hasCompletedOnboarding) || isCategorizeModalOpen || isCreateCollectionModalOpen;
    document.body.style.overflow = shouldLockScroll ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isPlayerExpanded, isSettingsOpen, hasCompletedOnboarding, isCategorizeModalOpen, isCreateCollectionModalOpen, user]);

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
  }, [podcasts, recordActivity, recordCompletion, streakData.enabled, streakData.difficulty, updatePodcastInState]);

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

  const handlePlaybackEnd = () => {
    if (isPlayerExpanded) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 5000);
    }

    if (completionSound !== 'none') {
      const soundUrl = COMPLETION_SOUND_URLS[completionSound];
      if (soundUrl && soundAudioRef.current) {
        soundAudioRef.current.src = soundUrl;
        soundAudioRef.current.play().catch(e => console.error("Error playing completion sound:", e));
      }
    }
  
    if (currentPodcastId) {
       updatePodcastInState(currentPodcastId, { isListened: true });
    }

    if (nextPodcastOnEnd) {
      startPlayback(nextPodcastOnEnd);
      setNextPodcastOnEnd(null);
    } else {
      setIsPlaying(false);
    }
  };

  const startPlayback = useCallback((id: string) => {
    const podcastToPlay = podcasts.find(p => p.id === id);
    if (podcastToPlay) {
      setActivePlayerTime(podcastToPlay.progress);
    }
    setCurrentPodcastId(id);
    setIsPlaying(true);
    if (!isPlayerExpanded) setIsPlayerExpanded(true);
  }, [isPlayerExpanded, podcasts]);
  
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
              
              // We only import settings, not podcasts/collections as they are now cloud-based
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
          url: '', // URL is not stored in Firestore for local files
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
        setIsPlaying(false);
        setCurrentPodcastId(null);
        setIsPlayerExpanded(false);
    }
    
    const podcastToDelete = podcasts.find(p => p.id === id);
    if (!podcastToDelete) return;
    
    // Delete from IndexedDB if it's a user upload
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
        
        // This will trigger a full data reset in useUserData
        updateUserData(null); 

        setIsPlaying(false);
        setCurrentPodcastId(null);
        setIsClearDataModalOpen(false);
        setIsLoading(false);
     }
  };
  
  const currentPodcast = useMemo(() => 
    podcasts.find(p => p.id === currentPodcastId),
    [podcasts, currentPodcastId]
  );
  
  if (isAuthLoading || (user && isDataLoading)) {
    return <LoadingSpinner />;
  }
  
  if (!user) {
    return (
      <div className="text-brand-text min-h-screen">
        <AuthForm />
      </div>
    );
  }
  
  return (
    <div className="text-brand-text min-h-screen">
      <audio ref={soundAudioRef} preload="auto" />
      {showConfetti && <Confetti count={50} theme={theme} />}

      <AppUI
        user={user}
        onLogout={logout}
        hasCompletedOnboarding={hasCompletedOnboarding}
        onOnboardingComplete={handleOnboardingComplete}
        onImportData={handleImportData}
        podcasts={podcasts}
        collections={collections}
        title={title}
        setTitle={(newTitle: string) => updateUserData({ title: newTitle })}
        streakData={streakData}
        isTodayComplete={isTodayComplete}
        currentPodcastId={currentPodcastId}
        isPlaying={isPlaying}
        isPlayerExpanded={isPlayerExpanded}
        setIsPlaying={setIsPlaying}
        setIsPlayerExpanded={setIsPlayerExpanded}
        updatePodcastProgress={updatePodcastProgress}
        handlePlaybackEnd={handlePlaybackEnd}
        customArtwork={customArtwork}
        playbackRate={playbackRate}
        setPlaybackRate={setPlaybackRate}
        activePlayerTime={activePlayerTime}
        setActivePlayerTime={setActivePlayerTime}
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
        setStreakData={handleSetStreakData}
        setPodcasts={(newPodcasts: Podcast[]) => updateUserData({ podcasts: newPodcasts })}
        setCollections={(newCollections: Collection[]) => updateUserData({ collections: newCollections })}
        unrecordCompletion={unrecordCompletion}
        recordCompletion={recordCompletion}
        allPodcastsSorted={allPodcastsSorted}
        reviewPrompt={reviewPrompt}
        setReviewPrompt={setReviewPrompt}
        setNextPodcastOnEnd={setNextPodcastOnEnd}
        startPlayback={startPlayback}
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
        onFileUpload={handleFileUpload}
        onDeletePodcast={handleDeletePodcast}
        onResetProgress={handleResetProgress}
        onClearLocalFiles={handleClearLocalFiles}
        onResetPreloaded={handleResetPreloaded}
        onClearAll={handleClearAll}
        totalStorageUsed={totalStorageUsed}
      />
      
      {currentPodcast && (
        <Player
          key={currentPodcast.id}
          podcast={currentPodcast}
          isPlaying={isPlaying}
          setIsPlaying={setIsPlaying}
          onProgressSave={updatePodcastProgress}
          onEnded={handlePlaybackEnd}
          isPlayerExpanded={isPlayerExpanded}
          setIsPlayerExpanded={setIsPlayerExpanded}
          artworkUrl={customArtwork}
          playbackRate={playbackRate}
          onPlaybackRateChange={setPlaybackRate}
          currentTime={activePlayerTime}
          onCurrentTimeUpdate={setActivePlayerTime}
          onDurationFetch={updatePodcastDuration}
          userId={user.uid}
          layoutMode={playerLayout}
        />
      )}
    </div>
  );
}

function useStreak(streakData: StreakData, updateUserData: (data: Partial<any>) => void) {
  const todayStr = useMemo(() => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Paris' }).format(new Date()), []);
  
  const STREAK_GOALS: Record<StreakDifficulty, number> = { easy: 1, normal: 1, hard: 2, extreme: 3 };

  const getTodaysCompletions = useCallback((data: StreakData) => {
    if (data.completionDate === todayStr) return data.completedToday;
    return [];
  }, [todayStr]);

  const updateStreak = useCallback((data: StreakData, forceToday?: boolean) => {
      const today = new Date();
      const currentTodayStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Paris' }).format(today);
      if (data.lastListenDate === currentTodayStr && !forceToday) return data;
      
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      const yesterdayStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Paris' }).format(yesterday);
      
      const isConsecutive = data.lastListenDate === yesterdayStr;
      const newCurrentStreak = isConsecutive ? data.currentStreak + 1 : 1;
      
      const newHistory = new Set(data.history || []);
      newHistory.add(currentTodayStr);

      return {
        ...data,
        lastListenDate: currentTodayStr,
        currentStreak: newCurrentStreak,
        history: Array.from(newHistory),
      };
  }, []);

  const recordActivity = useCallback(() => {
    if (streakData.difficulty !== 'easy' || streakData.lastListenDate === todayStr) return;
    const newStreakData = updateStreak(streakData);
    updateUserData({ streakData: newStreakData });
  }, [streakData, todayStr, updateStreak, updateUserData]);

  const recordCompletion = useCallback((podcastId: string) => {
    if (streakData.difficulty === 'easy') return;
    const todaysCompletions = getTodaysCompletions(streakData);
    const newCompletedToday = [...new Set([...todaysCompletions, podcastId])];
    let updatedData = { ...streakData, completedToday: newCompletedToday, completionDate: todayStr };
    const goal = STREAK_GOALS[updatedData.difficulty];
    if (newCompletedToday.length >= goal && updatedData.lastListenDate !== todayStr) {
      updatedData = updateStreak(updatedData, true);
    }
    updateUserData({ streakData: updatedData });
  }, [streakData, todayStr, getTodaysCompletions, STREAK_GOALS, updateStreak, updateUserData]);

  const unrecordCompletion = useCallback((podcastId: string) => {
     if (streakData.difficulty === 'easy') return;
     const newStreakData = {
       ...streakData,
       completedToday: getTodaysCompletions(streakData).filter((id: string) => id !== podcastId),
       completionDate: todayStr,
     };
     updateUserData({ streakData: newStreakData });
  }, [streakData, getTodaysCompletions, todayStr, updateUserData]);

  const isTodayComplete = useMemo(() => {
    if (!streakData.enabled) return false;
    if (streakData.difficulty === 'easy') return streakData.lastListenDate === todayStr;
    const goal = STREAK_GOALS[streakData.difficulty];
    return getTodaysCompletions(streakData).length >= goal;
  }, [streakData, todayStr, getTodaysCompletions, STREAK_GOALS]);
  
  const resetStreakProgress = useCallback(() => {
     const newStreakData = {
        ...streakData,
        lastListenDate: null,
        currentStreak: 0,
        completionDate: null,
        completedToday: [],
        history: []
     };
     updateUserData({ streakData: newStreakData });
  }, [streakData, updateUserData]);

  return { recordActivity, recordCompletion, unrecordCompletion, isTodayComplete, resetStreakProgress };
}
