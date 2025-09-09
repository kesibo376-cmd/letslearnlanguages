



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
    status
  } = useUserData(user?.uid);

  const { log } = useDebug();
  const [_, setTheme] = useTheme(); // Renaming to avoid conflict, we only need the setter.
  useEffect(() => {
    if (theme) {
      setTheme(theme);
    }
  }, [theme, setTheme]);
  
  const { recordActivity, recordCompletion, unrecordCompletion, isTodayComplete } = useStreak(streakData, updateUserData);

  // App State
  const [currentPodcastId, setCurrentPodcastId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaybackLoading, setIsPlaybackLoading] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPlayerExpanded, setIsPlayerExpanded] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [activePlayerTime, setActivePlayerTime] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [reviewPrompt, setReviewPrompt] = useState<{ show: boolean; podcastToReview: Podcast | null; podcastToPlay: Podcast | null; }>({ show: false, podcastToReview: null, podcastToPlay: null });
  const [nextPodcastOnEnd, setNextPodcastOnEnd] = useState<string | null>(null);
  const [isCategorizeModalOpen, setIsCategorizeModalOpen] = useState(false);
  const [podcastsToCategorize, setPodcastsToCategorize] = useState<Podcast[]>([]);
  const [isCreateCollectionModalOpen, setIsCreateCollectionModalOpen] = useState(false);
  const [currentView, setCurrentView] = useState<string | null>(null); // null for all, collection.id for specific
  const [isClearDataModalOpen, setIsClearDataModalOpen] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const prevProgressRef = useRef<number>(0);

  // Derived State
  const allPodcastsSorted = useMemo(() => [...(podcasts || [])].sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true })), [podcasts]);
  
  const podcastsInCurrentView = useMemo(() => {
    if (!useCollectionsView || currentView === null) {
        if (currentView === 'uncategorized') return allPodcastsSorted.filter(p => p.collectionId === null);
        return allPodcastsSorted;
    }
    const collectionId = currentView === 'uncategorized' ? null : currentView;
    return allPodcastsSorted.filter(p => p.collectionId === collectionId);
  }, [allPodcastsSorted, useCollectionsView, currentView]);

  const currentPodcast = useMemo(() => allPodcastsSorted.find(p => p.id === currentPodcastId), [allPodcastsSorted, currentPodcastId]);

  // Data setters
  const setPodcasts = (newPodcasts: Podcast[]) => updateUserData({ podcasts: newPodcasts });
  const setCollections = (newCollections: Collection[]) => updateUserData({ collections: newCollections });
  const setTitle = (newTitle: string) => updateUserData({ title: newTitle });
  const setStreakData = (newStreakData: StreakData) => updateUserData({ streakData: newStreakData });
  const setHideCompleted = (value: boolean) => updateUserData({ hideCompleted: value });
  const setReviewModeEnabled = (value: boolean) => updateUserData({ reviewModeEnabled: value });
  const setCompletionSound = (sound: CompletionSound) => updateUserData({ completionSound: sound });
  const setUseCollectionsView = (value: boolean) => updateUserData({ useCollectionsView: value });
  const setPlayOnNavigate = (value: boolean) => updateUserData({ playOnNavigate: value });
  const setPlayerLayout = (layout: LayoutMode) => updateUserData({ playerLayout: layout });
  const setLanguage = (lang: Language) => updateUserData({ language: lang });
  const setShowPlaybackSpeedControl = (value: boolean) => updateUserData({ showPlaybackSpeedControl: value });
  const setLastPlayedCollectionId = (id: string | null) => updateUserData({ lastPlayedCollectionId: id });

  // Audio Processing and File Handling
  const getAudioDuration = (file: File): Promise<number> => {
    return new Promise((resolve, reject) => {
      const audio = document.createElement('audio');
      audio.preload = 'metadata';
      audio.onloadedmetadata = () => {
        window.URL.revokeObjectURL(audio.src);
        resolve(audio.duration);
      };
      audio.onerror = reject;
      audio.src = window.URL.createObjectURL(file);
    });
  };

  const handleFileUpload = useCallback(async (files: FileList) => {
    setIsLoading(true);
    const newPodcasts: Podcast[] = [];
    for (const file of Array.from(files)) {
      try {
        const duration = await getAudioDuration(file);
        const id = uuidv4();
        await db.saveAudio(id, file);
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
        console.error('Error processing file:', file.name, error);
        alert(`Error processing file: ${file.name}`);
      }
    }
    
    if (newPodcasts.length > 0) {
        setPodcasts([...(podcasts || []), ...newPodcasts]);
        if (useCollectionsView) {
            setPodcastsToCategorize(newPodcasts);
            setIsCategorizeModalOpen(true);
        }
    }
    setIsLoading(false);
  }, [podcasts, useCollectionsView]);

  const handleDeletePodcast = useCallback(async (id: string) => {
    const podcastToDelete = podcasts.find((p: Podcast) => p.id === id);
    if (podcastToDelete?.storage === 'indexeddb') {
      await db.deleteAudio(id);
    }
    const newPodcasts = podcasts.filter((p: Podcast) => p.id !== id);
    setPodcasts(newPodcasts);
    if (currentPodcastId === id) {
      setCurrentPodcastId(null);
      setIsPlaying(false);
    }
  }, [podcasts, currentPodcastId]);

  const handleDeleteCollection = useCallback((id: string) => {
    // Reassign podcasts to uncategorized
    const updatedPodcasts = podcasts.map((p: Podcast) => p.collectionId === id ? { ...p, collectionId: null } : p);
    setPodcasts(updatedPodcasts);
    // Remove collection
    setCollections(collections.filter((c: Collection) => c.id !== id));
  }, [podcasts, collections]);
  
  // Player Logic
  const onSelectPodcast = useCallback((id: string) => {
    if (id === currentPodcastId) {
        if (audioRef.current) {
            audioRef.current.paused ? audioRef.current.play().catch(e => console.error(e)) : audioRef.current.pause();
        }
        return;
    }
    const newPodcast = allPodcastsSorted.find(p => p.id === id);
    if (!newPodcast) return;

    if (reviewModeEnabled && currentPodcastId && isPlaying) {
        const currentIndex = allPodcastsSorted.findIndex(p => p.id === currentPodcastId);
        const nextIndex = allPodcastsSorted.findIndex(p => p.id === id);
        
        if (nextIndex === currentIndex + 1 && !allPodcastsSorted[currentIndex].isListened) {
            setReviewPrompt({ show: true, podcastToReview: allPodcastsSorted[currentIndex], podcastToPlay: newPodcast });
            return;
        }
    }

    setCurrentPodcastId(id);
    if (audioRef.current) audioRef.current.currentTime = newPodcast.progress || 0;
    setIsPlaying(true);
  }, [currentPodcastId, reviewModeEnabled, allPodcastsSorted, isPlaying]);

  const onTogglePlayPause = useCallback(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(e => console.error("Play error:", e));
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  const onSkip = (seconds: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime + seconds);
    }
  };

  const onSeek = (newTime: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
      setActivePlayerTime(newTime);
    }
  };
  
  // Audio Element Effects
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
    }
    const audio = audioRef.current;
    
    const handlePlay = () => {
      setIsPlaying(true);
      setIsPlayerExpanded(true);
    };
    const handlePause = () => setIsPlaying(false);
    const handleTimeUpdate = () => {
        if (!audio) return;
        const currentTime = audio.currentTime;
        setActivePlayerTime(currentTime);

        // Update progress in DB every 5 seconds
        if (currentPodcastId && Math.abs(currentTime - prevProgressRef.current) > 5) {
            prevProgressRef.current = currentTime;
            const updatedPodcasts = podcasts.map((p: Podcast) => p.id === currentPodcastId ? { ...p, progress: currentTime } : p);
            setPodcasts(updatedPodcasts);
        }
    };
    const handleEnded = () => {
        if (!currentPodcastId) return;

        const podcastThatEnded = podcasts.find((p: Podcast) => p.id === currentPodcastId);
        if (podcastThatEnded && !podcastThatEnded.isListened) {
            const updatedPodcasts = podcasts.map((p: Podcast) => p.id === currentPodcastId ? { ...p, isListened: true, progress: 0, completedAt: Date.now() } : p);
            setPodcasts(updatedPodcasts);
            if (streakData.enabled && streakData.difficulty !== 'easy') recordCompletion(currentPodcastId);

            setShowConfetti(true);
            setTimeout(() => setShowConfetti(false), 5000);

            if (completionSound !== 'none') {
              const soundKeys = Object.keys(COMPLETION_SOUND_URLS) as Exclude<CompletionSound, 'none' | 'random'>[];
              const soundToPlay = completionSound === 'random' ? soundKeys[Math.floor(Math.random() * soundKeys.length)] : completionSound;
              const soundUrl = COMPLETION_SOUND_URLS[soundToPlay];
              if (soundUrl) new Audio(soundUrl).play();
            }
        }

        const playNext = (id: string) => {
            const podcastToPlay = allPodcastsSorted.find(p => p.id === id);
            if (podcastToPlay) {
                if (podcastToPlay.collectionId !== currentPodcast?.collectionId) {
                    setCurrentView(podcastToPlay.collectionId || 'uncategorized');
                }
                setCurrentPodcastId(id);
                setIsPlaying(true);
            }
        };

        if (nextPodcastOnEnd) {
            playNext(nextPodcastOnEnd);
            setNextPodcastOnEnd(null);
            return;
        }

        const currentIndex = podcastsInCurrentView.findIndex(p => p.id === currentPodcastId);
        if (currentIndex > -1 && currentIndex < podcastsInCurrentView.length - 1) {
            playNext(podcastsInCurrentView[currentIndex + 1].id);
        } else {
            setIsPlaying(false);
        }
    };
    
    const handleCanPlay = () => setIsPlaybackLoading(false);
    const handleWaiting = () => setIsPlaybackLoading(true);

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('waiting', handleWaiting);

    return () => {
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('waiting', handleWaiting);
    };
  }, [currentPodcastId, podcasts, recordCompletion, streakData.enabled, streakData.difficulty, completionSound, allPodcastsSorted, nextPodcastOnEnd, podcastsInCurrentView, currentPodcast?.collectionId]);

  useEffect(() => {
    const loadAudio = async () => {
        if (!currentPodcast || !audioRef.current) return;
        
        setIsPlaybackLoading(true);
        let src = '';
        if (currentPodcast.storage === 'indexeddb') {
            const audioBlob = await db.getAudio(currentPodcast.id);
            if (audioBlob) {
                src = URL.createObjectURL(audioBlob);
            }
        } else {
            src = currentPodcast.url;
        }

        if (src && audioRef.current) {
            audioRef.current.src = src;
            audioRef.current.currentTime = currentPodcast.progress || 0;
            audioRef.current.play().catch(e => {
              console.error("Error playing audio on load:", e);
              setIsPlaying(false);
            });
        }
    };
    loadAudio();
  }, [currentPodcast]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = playbackRate;
  }, [playbackRate]);

  // General Effects
  useEffect(() => {
    if (streakData.enabled && streakData.difficulty === 'easy' && isPlaying) {
        recordActivity();
    }
  }, [isPlaying, streakData.enabled, streakData.difficulty, recordActivity]);

  // Data Management Functions
  const handleSetCustomArtwork = (url: string | null) => updateUserData({ customArtwork: url });
  
  const dataToExport = {
    ...data,
    podcasts: podcasts.filter((p: Podcast) => p.storage === 'preloaded'), // Don't export local files data
  };
  
  const handleImportData = (file: File, onSuccess?: () => void) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importedData = JSON.parse(event.target?.result as string);
        updateUserData(importedData);
        if (onSuccess) onSuccess();
      } catch (e) {
        alert('Invalid backup file.');
      }
    };
    reader.readAsText(file);
  };

  const handleResetProgress = () => {
    const resetPodcasts = podcasts.map((p: Podcast) => ({ ...p, progress: 0, isListened: false, completedAt: null }));
    setPodcasts(resetPodcasts);
    updateUserData({
      streakData: { ...streakData, currentStreak: 0, lastListenDate: null, history: [], completedToday: [], completionDate: null },
    });
  };
  
  const handleClearLocalFiles = async () => {
      const localFiles = podcasts.filter((p: Podcast) => p.storage === 'indexeddb');
      for (const file of localFiles) {
          await db.deleteAudio(file.id);
      }
      setPodcasts(podcasts.filter((p: Podcast) => p.storage !== 'indexeddb'));
      setIsClearDataModalOpen(false);
  };
  
  const handleResetPreloaded = () => {
      const defaultData = getDefaultData();
      const localFiles = podcasts.filter((p: Podcast) => p.storage === 'indexeddb');
      const updatedPodcasts = [...localFiles, ...defaultData.podcasts];
      setPodcasts(updatedPodcasts);
      setIsClearDataModalOpen(false);
  };
  
  const handleClearAll = async () => {
      await db.clearAllAudio();
      updateUserData(getDefaultData());
      setIsClearDataModalOpen(false);
  };
  
  const handleUpdatePreloadedData = () => {
    if (window.confirm("This will add new preloaded content and may reset progress on existing preloaded content if there are updates. Your uploaded files will not be affected. Continue?")) {
        const defaultData = getDefaultData();
        const localFiles = podcasts.filter((p: Podcast) => p.storage === 'indexeddb');
        const updatedPodcasts = [...localFiles];
        
        defaultData.podcasts.forEach(dp => {
            if (!podcasts.find((p: Podcast) => p.id === dp.id)) {
                updatedPodcasts.push(dp);
            }
        });

        const updatedCollections = [...collections];
        defaultData.collections.forEach(dc => {
            if (!collections.find((c: Collection) => c.id === dc.id)) {
                updatedCollections.push(dc);
            }
        });
        
        setPodcasts(updatedPodcasts);
        setCollections(updatedCollections);
        alert("Preloaded data updated!");
    }
  };

  // Render Logic
  if (isAuthLoading || (user && isDataLoading)) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <LanguageProvider language={language || 'en'}><AuthForm /></LanguageProvider>;
  }
  
  if (status === 'pending') {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-brand-bg p-4 text-center">
            <h1 className="text-2xl font-bold text-brand-text mb-4">Request Sent</h1>
            <p className="text-brand-text-secondary max-w-sm mb-6">Your request to access the app has been sent. Please wait for an administrator to approve it.</p>
            <button onClick={logout} className="px-4 py-2 bg-brand-primary text-brand-text-on-primary rounded-md b-border b-shadow">Logout</button>
        </div>
    );
  }
  
  if (!hasCompletedOnboarding) {
    return (
        <LanguageProvider language={language || 'en'}>
            <OnboardingModal 
                isOpen={true} 
                onComplete={() => updateUserData({ hasCompletedOnboarding: true })}
                onImportData={(file) => handleImportData(file, () => updateUserData({ hasCompletedOnboarding: true }))}
            />
        </LanguageProvider>
    );
  }

  return (
    <LanguageProvider language={language || 'en'}>
      {showConfetti && <Confetti count={50} theme={theme} />}
      <AppUI
        user={user}
        onLogout={logout}
        onImportData={handleImportData}
        podcasts={podcasts}
        collections={collections}
        title={title}
        setTitle={setTitle}
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
        setHideCompleted={setHideCompleted}
        reviewModeEnabled={reviewModeEnabled}
        setReviewModeEnabled={setReviewModeEnabled}
        completionSound={completionSound}
        setCompletionSound={setCompletionSound}
        useCollectionsView={useCollectionsView}
        setUseCollectionsView={setUseCollectionsView}
        playOnNavigate={playOnNavigate}
        setPlayOnNavigate={setPlayOnNavigate}
        playerLayout={playerLayout}
        setPlayerLayout={setPlayerLayout}
        lastPlayedCollectionId={lastPlayedCollectionId}
        setLastPlayedCollectionId={setLastPlayedCollectionId}
        handleSetCustomArtwork={handleSetCustomArtwork}
        dataToExport={dataToExport}
        theme={theme}
        setTheme={(newTheme: Theme) => updateUserData({ theme: newTheme })}
        setLanguage={setLanguage}
        setStreakData={setStreakData}
        setPodcasts={setPodcasts}
        setCollections={setCollections}
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
        onResetProgress={handleResetProgress}
        onClearLocalFiles={handleClearLocalFiles}
        // Fix: Pass the correct handler function `handleResetPreloaded` instead of the undefined `onResetPreloaded`.
        onResetPreloaded={handleResetPreloaded}
        // Fix: Pass the correct handler function `handleClearAll` instead of the undefined `onClearAll`.
        onClearAll={handleClearAll}
        // Fix: Pass the correct handler function `handleUpdatePreloadedData` instead of the undefined `onUpdatePreloadedData`.
        onUpdatePreloadedData={handleUpdatePreloadedData}
        totalStorageUsed={totalStorageUsed}
        onSelectPodcast={onSelectPodcast}
        onTogglePlayPause={onTogglePlayPause}
        onSkip={onSkip}
        onSeek={onSeek}
        showPlaybackSpeedControl={showPlaybackSpeedControl}
        setShowPlaybackSpeedControl={setShowPlaybackSpeedControl}
      />
      {process.env.NODE_ENV === 'development' && <DebugOverlay />}
    </LanguageProvider>
  );
}