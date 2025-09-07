import { useState, useEffect, useMemo, useCallback } from 'react';
import type { Podcast, Collection, Theme, StreakData, CompletionSound, LayoutMode, Language } from '../types';
import { db } from '../firebase';
import { PRELOADED_PODCAST_URLS } from '../lib/preloaded-audio';

const DEFAULT_STREAK_DATA: StreakData = {
  enabled: true,
  lastListenDate: null,
  currentStreak: 0,
  difficulty: 'normal',
  completionDate: null,
  completedToday: [],
  history: [],
};

const getStableIdFromUrl = (url: string) => {
  const marker = '.netlify.app/';
  const markerIndex = url.indexOf(marker);
  if (markerIndex > -1) {
    const path = url.substring(markerIndex + marker.length);
    return `preloaded-${path}`;
  }
  // Fallback for different URLs
  return `preloaded-${url}`;
};

const getNameFromUrl = (url: string): string => {
  try {
    const filename = url.substring(url.lastIndexOf('/') + 1);
    const decodedFilename = decodeURIComponent(filename);
    return decodedFilename.replace(/\.[^/.]+$/, "");
  } catch (e) {
    return 'Untitled';
  }
};

export const getDefaultData = () => ({
    podcasts: PRELOADED_PODCAST_URLS.map((item) => {
      let name = getNameFromUrl(item.url);
      if (item.collectionName === 'JP Foundation') {
        name = `Lesson ${name}`;
      }
      return {
        id: getStableIdFromUrl(item.url),
        name: name,
        url: item.url,
        duration: 0,
        progress: 0,
        isListened: false,
        storage: 'preloaded' as const,
        collectionId: item.collectionName ? item.collectionName.toLowerCase().replace(/\s+/g, '-') : null,
      };
    }),
    collections: PRELOADED_PODCAST_URLS
        .filter(p => p.collectionName)
        .map(p => ({ id: p.collectionName!.toLowerCase().replace(/\s+/g, '-'), name: p.collectionName! }))
        .filter((v, i, a) => a.findIndex(t => (t.id === v.id)) === i),
    title: 'My Audio Library',
    theme: 'brutalist' as Theme,
    streakData: DEFAULT_STREAK_DATA,
    hideCompleted: false,
    reviewModeEnabled: false,
    completionSound: 'minecraft' as CompletionSound,
    useCollectionsView: true,
    playOnNavigate: false,
    hasCompletedOnboarding: false,
    customArtwork: null,
    playerLayout: 'pimsleur' as LayoutMode,
    showPlaybackSpeedControl: true,
    lastPlayedCollectionId: null,
    language: 'en' as Language,
});


export function useUserData(userId?: string) {
    const [isDataLoading, setIsDataLoading] = useState(true);
    const [data, setData] = useState<any | null>(null);

    // Fix: Define `updateUserData` to handle updating user data in Firestore.
    const updateUserData = useCallback((updates: Partial<any> | null) => {
        if (!userId) {
            console.warn("updateUserData called without a userId.");
            return;
        }

        const docRef = db.collection('users').doc(userId);

        if (updates === null) {
            // Handle reset to default
            const defaultData = getDefaultData();
            // Preserve essential user info that shouldn't be reset
            const userDataToPreserve = {
                email: data?.email,
                status: data?.status,
                createdAt: data?.createdAt,
            };
            const dataToSet = { ...defaultData, ...userDataToPreserve };
            
            docRef.set(dataToSet).catch(err => {
                console.error("Error resetting user data:", err);
            });
        } else {
            // Handle partial update
            docRef.update(updates).catch(err => {
                console.error("Error updating user data:", err);
            });
        }
    }, [userId, data]);

    useEffect(() => {
        if (!userId) {
            setData(null);
            setIsDataLoading(false);
            return;
        }

        const docRef = db.collection('users').doc(userId);

        const unsubscribe = docRef.onSnapshot((docSnap) => {
            if (docSnap.exists) {
                const userData = docSnap.data();
                const defaultData = getDefaultData();

                const userPodcastIds = new Set((userData.podcasts || []).map(p => p.id));
                const missingPodcasts = defaultData.podcasts.filter(p => !userPodcastIds.has(p.id));

                const userCollectionsIds = new Set((userData.collections || []).map(c => c.id));
                const missingCollections = defaultData.collections.filter(c => !userCollectionsIds.has(c.id));
                
                const dataWithDefaults = { ...defaultData, ...userData };
                
                if (missingPodcasts.length > 0 || missingCollections.length > 0) {
                    const finalPodcasts = [...(dataWithDefaults.podcasts || []), ...missingPodcasts];
                    const finalCollections = [...(dataWithDefaults.collections || []), ...missingCollections];
                    
                    // Optimistically update local state for immediate UI response
                    setData({
                        ...dataWithDefaults,
                        podcasts: finalPodcasts,
                        collections: finalCollections,
                    });

                    // Persist the changes back to Firestore
                    docRef.update({
                        podcasts: finalPodcasts,
                        collections: finalCollections
                    }).catch(err => console.error("Failed to persist merged preloaded data:", err));
                } else {
                    // No new content, just set the data from firestore merged with defaults
                    setData(dataWithDefaults);
                }
            } else {
                console.log("No user data found for UID:", userId);
                setData(null);
            }
            setIsDataLoading(false);
        }, (error) => {
            console.error("Error fetching user data:", error);
            setIsDataLoading(false);
        });

        return () => unsubscribe();
    }, [userId]);
    
    const defaultData = useMemo(() => getDefaultData(), []);
    const loadedData = data || defaultData;

    const podcasts = loadedData.podcasts;
    const collections = loadedData.collections;
    const title = loadedData.title;
    const theme = loadedData.theme;
    const streakData = loadedData.streakData;
    const hideCompleted = loadedData.hideCompleted;
    const reviewModeEnabled = loadedData.reviewModeEnabled;
    const completionSound = loadedData.completionSound;
    const useCollectionsView = loadedData.useCollectionsView;
    const playOnNavigate = loadedData.playOnNavigate;
    const hasCompletedOnboarding = loadedData.hasCompletedOnboarding;
    const customArtwork = loadedData.customArtwork;
    const playerLayout = loadedData.playerLayout;
    const showPlaybackSpeedControl = loadedData.showPlaybackSpeedControl;
    const lastPlayedCollectionId = loadedData.lastPlayedCollectionId;
    const language = loadedData.language;
    const status = loadedData.status;
    
    const totalStorageUsed = useMemo(() => {
        if (podcasts) {
            return podcasts
                .filter((p: Podcast) => p.storage === 'indexeddb' && typeof p.size === 'number')
                .reduce((acc: number, p: Podcast) => acc + p.size!, 0);
        }
        return 0;
    }, [podcasts]);

    return {
        data: loadedData,
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
    };
}