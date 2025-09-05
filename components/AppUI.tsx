import React, { useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { Podcast, Collection, Theme, StreakData, CompletionSound, User, LayoutMode } from '../types';

import OnboardingModal from './OnboardingModal';
import SettingsModal from './SettingsModal';
import ReviewModal from './ReviewModal';
import CategorizeModal from './CategorizeModal';
import CreateCollectionModal from './CreateCollectionModal';
import ClearDataModal from './ClearDataModal';
import Header from './Header';
import StreakTracker from './StreakTracker';
import StatusBar from './StatusBar';
import PodcastList from './PodcastList';
import CollectionList from './CollectionList';
import PlusIcon from './icons/PlusIcon';
import ChevronLeftIcon from './icons/ChevronLeftIcon';
import SettingsIcon from './icons/SettingsIcon';

interface AppUIProps {
  user: User;
  onLogout: () => void;
  hasCompletedOnboarding: boolean;
  onOnboardingComplete: () => void;
  onImportData: (file: File, onSuccess?: () => void) => void;
  podcasts: Podcast[];
  collections: Collection[];
  title: string;
  setTitle: (newTitle: string) => void;
  streakData: StreakData;
  isTodayComplete: boolean;
  currentPodcastId: string | null;
  isPlaying: boolean;
  isPlayerExpanded: boolean;
  setIsPlaying: (playing: React.SetStateAction<boolean>) => void;
  setIsPlayerExpanded: (expanded: boolean) => void;
  customArtwork: string | null;
  activePlayerTime: number;
  isSettingsOpen: boolean;
  setIsSettingsOpen: (open: boolean) => void;
  hideCompleted: boolean;
  setHideCompleted: (value: boolean) => void;
  reviewModeEnabled: boolean;
  setReviewModeEnabled: (value: boolean) => void;
  completionSound: CompletionSound;
  setCompletionSound: (sound: CompletionSound) => void;
  useCollectionsView: boolean;
  setUseCollectionsView: (value: boolean) => void;
  playOnNavigate: boolean;
  setPlayOnNavigate: (value: boolean) => void;
  handleSetCustomArtwork: (url: string | null) => void;
  dataToExport: any;
  theme: Theme;
  setTheme: (newTheme: Theme) => void;
  layoutMode: LayoutMode;
  setLayoutMode: (newLayout: LayoutMode) => void;
  setStreakData: (data: StreakData) => void;
  setPodcasts: (newPodcasts: Podcast[]) => void;
  setCollections: (newCollections: Collection[]) => void;
  unrecordCompletion: (id: string) => void;
  recordCompletion: (id: string) => void;
  allPodcastsSorted: Podcast[];
  reviewPrompt: { show: boolean; podcastToReview: Podcast | null; podcastToPlay: Podcast | null };
  setReviewPrompt: (prompt: { show: boolean; podcastToReview: Podcast | null; podcastToPlay: Podcast | null }) => void;
  setNextPodcastOnEnd: (id: string | null) => void;
  startPlayback: (id: string) => void;
  isCategorizeModalOpen: boolean;
  setIsCategorizeModalOpen: (open: boolean) => void;
  podcastsToCategorize: Podcast[];
  setPodcastsToCategorize: (podcasts: Podcast[]) => void;
  isCreateCollectionModalOpen: boolean;
  setIsCreateCollectionModalOpen: (open: boolean) => void;
  currentView: string | null;
  setCurrentView: (view: string | null) => void;
  isClearDataModalOpen: boolean;
  setIsClearDataModalOpen: (open: boolean) => void;
  isLoading: boolean;
  onFileUpload: (files: FileList) => void;
  onDeletePodcast: (id: string) => void;
  onResetProgress: () => void;
  onResetCollectionProgress: (collectionId: string) => void;
  onClearLocalFiles: () => void;
  onResetPreloaded: () => void;
  onClearAll: () => void;
  totalStorageUsed: number;
}

const AppUI: React.FC<AppUIProps> = (props) => {
    const {
        user, onLogout, hasCompletedOnboarding, onOnboardingComplete, onImportData, podcasts, collections, title, setTitle,
        streakData, isTodayComplete, currentPodcastId, isPlaying, isPlayerExpanded, setIsPlaying,
        customArtwork, activePlayerTime, isSettingsOpen, setIsSettingsOpen, hideCompleted, setHideCompleted, reviewModeEnabled,
        setReviewModeEnabled, completionSound, setCompletionSound, useCollectionsView, setUseCollectionsView,
        playOnNavigate, setPlayOnNavigate, handleSetCustomArtwork, dataToExport, theme, setTheme, layoutMode,
        setLayoutMode, setStreakData, setPodcasts, setCollections, unrecordCompletion, recordCompletion,
        allPodcastsSorted, reviewPrompt, setReviewPrompt, setNextPodcastOnEnd, startPlayback, isCategorizeModalOpen,
        setIsCategorizeModalOpen, podcastsToCategorize, setPodcastsToCategorize, isCreateCollectionModalOpen,
        setIsCreateCollectionModalOpen, currentView, setCurrentView, isClearDataModalOpen, setIsClearDataModalOpen,
        isLoading, onFileUpload, onDeletePodcast, onResetProgress, onResetCollectionProgress, onClearLocalFiles,
        onResetPreloaded, onClearAll, totalStorageUsed
    } = props;

    const handleExportData = () => {
        const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
          JSON.stringify(dataToExport, null, 2)
        )}`;
        const link = document.createElement("a");
        link.href = jsonString;
        link.download = "audio_player_data.json";
        link.click();
    };

    const handleTogglePodcastComplete = (id: string) => {
        const podcast = podcasts.find(p => p.id === id);
        if (!podcast) return;

        const isNowCompleted = !podcast.isListened;
        const updatedPodcasts = podcasts.map(p =>
            p.id === id ? { ...p, isListened: isNowCompleted, progress: isNowCompleted ? p.duration : 0 } : p
        );
        setPodcasts(updatedPodcasts);

        if (streakData.enabled && streakData.difficulty !== 'easy') {
            if (isNowCompleted) {
                recordCompletion(id);
            } else {
                unrecordCompletion(id);
            }
        }
    };

    // Fix: Add the missing 'handleMovePodcastToCollection' function.
    const handleMovePodcastToCollection = (podcastId: string, newCollectionId: string | null) => {
        const updatedPodcasts = podcasts.map(p =>
            p.id === podcastId ? { ...p, collectionId: newCollectionId } : p
        );
        setPodcasts(updatedPodcasts);
    };

    const handleSelectPodcast = (id: string) => {
        if (id === currentPodcastId) {
            setIsPlaying(p => !p);
        } else {
            const selectedPodcast = podcasts.find(p => p.id === id);
            if (!selectedPodcast) return;
            
            if (reviewModeEnabled && !isPlayerExpanded) {
                const currentIndex = allPodcastsSorted.findIndex(p => p.id === id);
                if (currentIndex > 0) {
                    const previousPodcast = allPodcastsSorted[currentIndex - 1];
                    if (previousPodcast && previousPodcast.isListened) {
                        setReviewPrompt({ show: true, podcastToReview: previousPodcast, podcastToPlay: selectedPodcast });
                        return;
                    }
                }
            }
            startPlayback(id);
        }
    };

    // Base list of podcasts for the current view, ignoring hideCompleted
    const allPodcastsInCurrentView = useMemo(() => {
        if (useCollectionsView) {
            if (!currentView) return []; // No podcasts when on collection overview
            return allPodcastsSorted.filter(p =>
                currentView === 'uncategorized' ? p.collectionId === null : p.collectionId === currentView
            );
        }
        // Not using collections, so all podcasts are in the current view
        return allPodcastsSorted;
    }, [currentView, allPodcastsSorted, useCollectionsView]);

    // List of podcasts to actually display, respecting hideCompleted
    const podcastsForDisplay = useMemo(() => {
        return hideCompleted ? allPodcastsInCurrentView.filter(p => !p.isListened) : allPodcastsInCurrentView;
    }, [hideCompleted, allPodcastsInCurrentView]);

    // Calculate stats based on the *total* list for the view
    const listenedCount = useMemo(() => allPodcastsInCurrentView.filter(p => p.isListened).length, [allPodcastsInCurrentView]);
    const totalCount = useMemo(() => allPodcastsInCurrentView.length, [allPodcastsInCurrentView]);
    const percentage = useMemo(() => (totalCount > 0 ? (listenedCount / totalCount) * 100 : 0), [listenedCount, totalCount]);
    const currentCollection = useMemo(() => collections.find(c => c.id === currentView), [collections, currentView]);

    const handleAssignToCollection = (collectionId: string) => {
        const podcastIdsToMove = new Set(podcastsToCategorize.map(p => p.id));
        const updatedPodcasts = podcasts.map(p =>
            podcastIdsToMove.has(p.id) ? { ...p, collectionId } : p
        );
        setPodcasts(updatedPodcasts);
        setPodcastsToCategorize([]);
        setIsCategorizeModalOpen(false);
    };

    const handleCreateAndAssignCollection = (name: string) => {
        const newCollection = { id: uuidv4(), name };
        setCollections([...collections, newCollection]);

        const podcastIdsToMove = new Set(podcastsToCategorize.map(p => p.id));
        const updatedPodcasts = podcasts.map(p =>
            podcastIdsToMove.has(p.id) ? { ...p, collectionId: newCollection.id } : p
        );
        setPodcasts(updatedPodcasts);

        setPodcastsToCategorize([]);
        setIsCategorizeModalOpen(false);
    };
    
    const handleCreateCollection = (name: string) => {
        const newCollection = { id: uuidv4(), name };
        setCollections([...collections, newCollection]);
    };

    const handleDeleteCollection = (id: string) => {
        const updatedPodcasts = podcasts.map(p =>
            p.collectionId === id ? { ...p, collectionId: null } : p
        );
        setPodcasts(updatedPodcasts);
        setCollections(collections.filter(c => c.id !== id));
    };

    const handleRenameCollection = (id: string, newName: string) => {
        setCollections(collections.map(c => c.id === id ? { ...c, name: newName } : c));
    };

    const handleSetCollectionArtwork = (collectionId: string, url: string | null) => {
        setCollections(collections.map(c => {
            if (c.id === collectionId) {
                // Destructure to separate artworkUrl from the rest of the properties
                const { artworkUrl, ...rest } = c;
    
                // Create the updated collection object without the old artworkUrl
                const updatedCollection: Collection = { ...rest };
    
                // If a new, valid URL is provided, add it back.
                if (url && url.trim()) {
                    updatedCollection.artworkUrl = url;
                }
                
                // Otherwise, the property remains absent, effectively deleting it.
                return updatedCollection;
            }
            return c;
        }));
    };
    
    const handlePlayCollection = (collectionId: string | null) => {
        const podcastsInCollection = allPodcastsSorted.filter(p => p.collectionId === collectionId);
        const firstUnlistened = podcastsInCollection.find(p => !p.isListened);
        const firstPodcast = podcastsInCollection[0];
    
        if (firstUnlistened) {
          startPlayback(firstUnlistened.id);
        } else if (firstPodcast) {
          startPlayback(firstPodcast.id);
        } else {
          alert('This collection is empty.');
        }
      };

    return (
        <>
            <OnboardingModal 
                isOpen={!hasCompletedOnboarding}
                onComplete={onOnboardingComplete}
                onImportData={onImportData}
            />

            <div
                className={`flex flex-col min-h-screen p-4 sm:p-6 transition-all duration-300 ${isPlayerExpanded ? 'blur-sm' : ''}`}
            >
                <div className="flex flex-col flex-grow w-full max-w-4xl mx-auto pb-28">
                    <main>
                        {useCollectionsView && !currentView ? (
                            <>
                                 <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                                    <h1 className="text-3xl font-bold text-brand-text">{title}</h1>
                                    <div className="flex-shrink-0 flex items-center gap-2 self-end sm:self-center">
                                        <button onClick={() => setIsCreateCollectionModalOpen(true)} className="flex items-center justify-center bg-brand-primary text-brand-text-on-primary rounded-full p-2 sm:py-2 sm:px-4 b-border b-shadow b-shadow-hover transform hover:scale-105 active:scale-95">
                                          <PlusIcon size={20} />
                                          <span className="hidden sm:inline ml-2 font-bold">New Collection</span>
                                        </button>
                                        <button onClick={() => setIsSettingsOpen(true)} className="group p-3 rounded-full hover:bg-brand-surface transition-colors" aria-label="Open settings">
                                            <SettingsIcon size={24} className="text-brand-text-secondary group-hover:text-brand-text" />
                                        </button>
                                    </div>
                                </header>
                                {streakData.enabled && <div className="mb-6"><StreakTracker streakData={streakData} isTodayComplete={isTodayComplete} theme={theme} /></div>}
                                <CollectionList 
                                    collections={collections}
                                    podcasts={podcasts}
                                    onNavigateToCollection={setCurrentView}
                                    onPlayCollection={handlePlayCollection}
                                    onDeleteCollection={handleDeleteCollection}
                                    onRenameCollection={handleRenameCollection}
                                    onResetCollectionProgress={onResetCollectionProgress}
                                    onSetCollectionArtwork={handleSetCollectionArtwork}
                                    theme={theme}
                                />
                            </>
                        ) : (
                            <>
                                <Header 
                                    title={useCollectionsView ? (currentCollection?.name || "Uncategorized") : title}
                                    onSetTitle={setTitle}
                                    onFileUpload={onFileUpload}
                                    onOpenSettings={() => setIsSettingsOpen(true)}
                                    isLoading={isLoading}
                                />
                                {useCollectionsView && (
                                    <button onClick={() => setCurrentView(null)} className="flex items-center gap-2 text-sm text-brand-text-secondary hover:text-brand-text mb-4">
                                      <ChevronLeftIcon size={16} /> Back to Collections
                                    </button>
                                )}
                                
                                {streakData.enabled && <div className="mb-6"><StreakTracker streakData={streakData} isTodayComplete={isTodayComplete} theme={theme} /></div>}
                                
                                <StatusBar listenedCount={listenedCount} totalCount={totalCount} percentage={percentage} />

                                <div className="mt-4 bg-brand-surface-light rounded-lg shadow-inner overflow-hidden b-border">
                                    {podcastsForDisplay.length > 0 ? (
                                         <PodcastList
                                            podcasts={podcastsForDisplay}
                                            currentPodcastId={currentPodcastId}
                                            isPlaying={isPlaying}
                                            onSelectPodcast={handleSelectPodcast}
                                            onDeletePodcast={onDeletePodcast}
                                            onTogglePodcastComplete={handleTogglePodcastComplete}
                                            onMovePodcastToCollection={handleMovePodcastToCollection}
                                            hideCompleted={hideCompleted}
                                            activePlayerTime={activePlayerTime}
                                            collections={collections}
                                            useCollectionsView={useCollectionsView}
                                            layoutMode={layoutMode}
                                            customArtwork={customArtwork}
                                        />
                                    ) : (
                                        <div className="p-8 text-center text-brand-text-secondary">
                                            <p>No audio files here.</p>
                                            <p className="text-sm mt-1">{hideCompleted ? "All items are completed!" : "Upload some to get started!"}</p>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </main>
                    <footer className="text-center text-brand-text-secondary text-xs mt-auto pt-8">
                        bokesi
                    </footer>
                </div>
            </div>
            
            <SettingsModal 
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                onResetProgress={onResetProgress}
                onOpenClearDataModal={() => { setIsSettingsOpen(false); setIsClearDataModalOpen(true); }}
                currentTheme={theme}
                onSetTheme={setTheme}
                layoutMode={layoutMode}
                onSetLayoutMode={setLayoutMode}
                streakData={streakData}
                onSetStreakData={setStreakData}
                hideCompleted={hideCompleted}
                onSetHideCompleted={setHideCompleted}
                reviewModeEnabled={reviewModeEnabled}
                onSetReviewModeEnabled={setReviewModeEnabled}
                customArtwork={customArtwork}
                onSetCustomArtwork={handleSetCustomArtwork}
                onExportData={handleExportData}
                onImportData={(file) => onImportData(file, () => setIsSettingsOpen(false))}
                completionSound={completionSound}
                onSetCompletionSound={setCompletionSound}
                useCollectionsView={useCollectionsView}
                onSetUseCollectionsView={setUseCollectionsView}
                playOnNavigate={playOnNavigate}
                onSetPlayOnNavigate={setPlayOnNavigate}
                totalStorageUsed={totalStorageUsed}
                user={user}
                onLogout={onLogout}
            />

            <ReviewModal
                isOpen={reviewPrompt.show}
                onConfirm={() => {
                    if (reviewPrompt.podcastToReview && reviewPrompt.podcastToPlay) {
                        setNextPodcastOnEnd(reviewPrompt.podcastToPlay.id);
                        startPlayback(reviewPrompt.podcastToReview.id);
                    }
                    setReviewPrompt({ show: false, podcastToReview: null, podcastToPlay: null });
                }}
                onCancel={() => {
                    if (reviewPrompt.podcastToPlay) {
                        startPlayback(reviewPrompt.podcastToPlay.id);
                    }
                    setReviewPrompt({ show: false, podcastToReview: null, podcastToPlay: null });
                }}
                podcastName={reviewPrompt.podcastToReview?.name || ''}
            />

            <CategorizeModal
                isOpen={isCategorizeModalOpen}
                onClose={() => { setPodcastsToCategorize([]); setIsCategorizeModalOpen(false); }}
                collections={collections}
                podcastCount={podcastsToCategorize.length}
                onAssign={handleAssignToCollection}
                onCreateAndAssign={handleCreateAndAssignCollection}
            />

            <CreateCollectionModal 
                isOpen={isCreateCollectionModalOpen}
                onClose={() => setIsCreateCollectionModalOpen(false)}
                onCreate={handleCreateCollection}
            />
            
            <ClearDataModal
                isOpen={isClearDataModalOpen}
                onClose={() => setIsClearDataModalOpen(false)}
                onClearLocal={onClearLocalFiles}
                onResetPreloaded={onResetPreloaded}
                onClearAll={onClearAll}
            />
        </>
    );
};

export default AppUI;