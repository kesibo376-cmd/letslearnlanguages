
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

export const getDefaultData = () => ({
    podcasts: PRELOADED_PODCAST_URLS.map((item, index) => {
      const urlParts = item.url.split('/');
      const fileName = urlParts[urlParts.length - 1];
      let name = decodeURIComponent(fileName).replace(/\.[^/.]+$/, "");

      // If the name is purely numeric, prepend the collection name for clarity
      if (item.collectionName && /^\d+$/.test(name)) {
        name = `${item.collectionName} ${name}`;
      }

      return {
        id: `preloaded-${index}`,
        name: name || `Preloaded Audio ${index + 1}`, // fallback
        url: item.url,
        duration: 0, // Will be fetched on playback
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

    useEffect(() => {
        if (!userId) {
            setData(null);
            setIsDataLoading(false);
            return;
        }

        // FIX: Use v8 compat syntax for document reference
        const docRef = db.collection('users').doc(userId);

        // FIX: Use v8 compat syntax for onSnapshot and check .exists property
        const unsubscribe = docRef.onSnapshot((docSnap) => {
            if (docSnap.exists) {
                setData(docSnap.data());
            } else {
                // User document doesn't exist, so this is a new user.
                // The signup function in AuthContext will create the initial document.
                console.log("No user data found for UID:", userId);
                setData(null); // Or some indicator that it's a new user
            }
            setIsDataLoading(false);
        }, (error) => {
            console.error("Error fetching user data:", error);
            setIsDataLoading(false);
        });

        return () => unsubscribe(); // Cleanup listener on unmount
    }, [userId]);
    
    const updateUserData = useCallback(async (updates: Partial<any> | null) => {
        if (!userId) return;
        // FIX: Use v8 compat syntax for document reference
        const docRef = db.collection('users').doc(userId);
        try {
            if (updates === null) {
              // A null update means reset the user's data to default
              // FIX: Use v8 compat syntax for set()
              await docRef.set(getDefaultData());
            } else {
              // Using updateDoc directly is simpler and more robust for offline scenarios.
              // It will fail if the document doesn't exist, but that's the correct
              // behavior for an update. We handle that failure below.
              // FIX: Use v8 compat syntax for update()
              await docRef.update(updates);
            }
        } catch (error) {
            console.error("Error updating user data:", error);
            // If update fails because doc doesn't exist (e.g. race condition on signup),
            // we can try to create it with the merged data as a fallback.
            if (error instanceof Error && 'code' in error && (error as any).code === 'not-found') {
                console.log("Document not found, creating it with merged data.");
                try {
                    // FIX: Use v8 compat syntax for set()
                    await docRef.set({ ...getDefaultData(), ...updates });
                } catch (e) {
                    console.error("Error creating document after update failed:", e);
                }
            }
        }
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
