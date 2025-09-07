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

export const getDefaultData = () => {
    const lessonCounters: { [key: string]: number } = {};
    return {
        podcasts: PRELOADED_PODCAST_URLS.map((item) => {
          const collectionName = item.collectionName || 'Untitled';
          lessonCounters[collectionName] = (lessonCounters[collectionName] || 0) + 1;
          const lessonNumber = lessonCounters[collectionName];
          
          const name = `${collectionName} ${lessonNumber}`;
    
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
    }
};


export function useUserData(userId?: string) {
    const [isDataLoading, setIsDataLoading] = useState(true);
    const [data, setData] = useState<any | null>(null);

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
                const userData = docSnap.data() as any;
                const defaultData = getDefaultData();

                // --- Robust Data Sync Logic ---
                const userPodcasts: Podcast[] = userData.podcasts || [];
                const userCollections: Collection[] = userData.collections || [];

                // 1. Isolate user-uploaded files, which should always be preserved.
                const userUploadedPodcasts = userPodcasts.filter(p => p.storage === 'indexeddb');

                // 2. Create a map of the user's state for existing preloaded files, keyed by URL.
                const userStateMap = new Map<string, { progress: number; isListened: boolean; duration: number }>();
                userPodcasts
                    .filter(p => p.storage === 'preloaded' && p.url)
                    .forEach(p => {
                        userStateMap.set(p.url, { progress: p.progress, isListened: p.isListened, duration: p.duration });
                    });

                // 3. Rebuild the preloaded podcast list from the app's default data (the source of truth).
                const syncedPreloadedPodcasts = defaultData.podcasts.map((defaultPodcast) => {
                    const userState = userStateMap.get(defaultPodcast.url);
                    // If state exists for this URL, merge it with the fresh default podcast object.
                    if (userState) {
                        // Preserve the fetched duration if it exists and is a valid number, otherwise use the default.
                        const duration = (userState.duration && !isNaN(userState.duration) && userState.duration > 0)
                            ? userState.duration
                            : defaultPodcast.duration;
                        return { ...defaultPodcast, progress: userState.progress, isListened: userState.isListened, duration };
                    }
                    return defaultPodcast;
                });

                // 4. Combine the pristine user-uploaded list with the newly synced preloaded list.
                const finalPodcasts = [...userUploadedPodcasts, ...syncedPreloadedPodcasts];

                // 5. Sync collections: Preserve user-created collections and merge user customizations (like artwork) into default collections.
                const defaultCollectionIds = new Set(defaultData.collections.map(c => c.id));
                const userCreatedCollections = userCollections.filter(c => !defaultCollectionIds.has(c.id));
                const syncedDefaultCollections = defaultData.collections.map(defaultCollection => {
                    const userCollectionVersion = userCollections.find(uc => uc.id === defaultCollection.id);
                    return userCollectionVersion ? { ...defaultCollection, ...userCollectionVersion } : defaultCollection;
                });
                const finalCollections = [...syncedDefaultCollections, ...userCreatedCollections];
                
                // 6. Check if an update to Firestore is necessary to avoid unnecessary writes.
                const sortById = (a: {id: string}, b: {id: string}) => a.id.localeCompare(b.id);
                const hasPodcastChanges = JSON.stringify(finalPodcasts.slice().sort(sortById)) !== JSON.stringify((userData.podcasts || []).slice().sort(sortById));
                const hasCollectionChanges = JSON.stringify(finalCollections.slice().sort(sortById)) !== JSON.stringify((userData.collections || []).slice().sort(sortById));

                const dataWithDefaults = { ...defaultData, ...userData };

                if (hasPodcastChanges || hasCollectionChanges) {
                     // Optimistically update local state for a snappy UI response.
                     setData({
                        ...dataWithDefaults,
                        podcasts: finalPodcasts,
                        collections: finalCollections,
                     });
                     // Persist the synced data back to Firestore.
                     docRef.update({
                        podcasts: finalPodcasts,
                        collections: finalCollections
                     }).catch(err => console.error("Failed to sync preloaded data:", err));
                } else {
                     // No changes needed, just load the data as is (with defaults filled in).
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