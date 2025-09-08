

import React, { useMemo, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { Podcast, Collection, Theme, StreakData, CompletionSound, User, LayoutMode, Language } from '../types';
import { useTranslation } from '../contexts/LanguageContext';

import Header from './Header';
import PodcastList from './PodcastList';
import CollectionList from './CollectionList';
import StatusBar from './StatusBar';
import StreakTracker from './StreakTracker';
import SettingsModal from './SettingsModal';
import ReviewModal from './ReviewModal';
import CategorizeModal from './CategorizeModal';
import CreateCollectionModal from './CreateCollectionModal';
import ClearDataModal from './ClearDataModal';
import Player from './Player';
import ChevronLeftIcon from './icons/ChevronLeftIcon';
import PlayCircleIcon from './icons/PlayCircleIcon';
import PlusIcon from './icons/PlusIcon';

interface AppUIProps {
    user: User;
    onLogout: () => void;
    onImportData: (file: File, onSuccess?: () => void) => void;
    podcasts: Podcast[];
    collections: Collection[];
    title: string;
    setTitle: (title: string) => void;
    streakData: StreakData;
    isTodayComplete: boolean;
    currentPodcastId: string | null;
    currentPodcast: Podcast | undefined;
    isPlaying: boolean;
    isPlayerExpanded: boolean;
    setIsPlayerExpanded: React.Dispatch<React.SetStateAction<boolean>>;
    customArtwork: string | null;
    playbackRate: number;
    setPlaybackRate: React.Dispatch<React.SetStateAction<number>>;
    activePlayerTime: number;
    isSettingsOpen: boolean;
    setIsSettingsOpen: React.Dispatch<React.SetStateAction<boolean>>;
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
    playerLayout: LayoutMode;
    setPlayerLayout: (layout: LayoutMode) => void;
    lastPlayedCollectionId: string | null;
    setLastPlayedCollectionId: (id: string | null) => void;
    handleSetCustomArtwork: (url: string | null) => void;
    dataToExport: any;
    theme: Theme;
    setTheme: (theme: Theme) => void;
    setLanguage: (language: Language) => void;
    setStreakData: (data: StreakData) => void;
    setPodcasts: (data: Podcast[]) => void;
    setCollections: (data: Collection[]) => void;
    unrecordCompletion: (podcastId: string) => void;
    recordCompletion: (podcastId: string) => void;
    allPodcastsSorted: Podcast[];
    podcastsInCurrentView: Podcast[];
    reviewPrompt: { show: boolean; podcastToReview: Podcast | null; podcastToPlay: Podcast | null; };
    setReviewPrompt: React.Dispatch<React.SetStateAction<{ show: boolean; podcastToReview: Podcast | null; podcastToPlay: Podcast | null; }>>;
    setNextPodcastOnEnd: React.Dispatch<React.SetStateAction<string | null>>;
    isCategorizeModalOpen: boolean;
    setIsCategorizeModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
    podcastsToCategorize: Podcast[];
    setPodcastsToCategorize: React.Dispatch<React.SetStateAction<Podcast[]>>;
    isCreateCollectionModalOpen: boolean;
    setIsCreateCollectionModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
    currentView: string | null;
    setCurrentView: React.Dispatch<React.SetStateAction<string | null>>;
    isClearDataModalOpen: boolean;
    setIsClearDataModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
    isLoading: boolean; // For file uploads
    isPlaybackLoading: boolean; // For audio playback
    onFileUpload: (files: FileList) => void;
    onDeletePodcast: (id: string) => void;
    onDeleteCollection: (id: string) => void;
    onResetProgress: () => void;
    onClearLocalFiles: () => void;
    onResetPreloaded: () => void;
    onClearAll: () => void;
    onUpdatePreloadedData: () => void;
    totalStorageUsed: number;
    onSelectPodcast: (id: string) => void;
    onTogglePlayPause: () => void;
    onSkip: (seconds: number) => void;
    onSeek: (newTime: number) => void;
    showPlaybackSpeedControl: boolean;
    setShowPlaybackSpeedControl: (value: boolean) => void;
}

const AppUI: React.FC<AppUIProps> = (props) => {
  const {
    user, onLogout, onImportData, podcasts, collections,
    title, setTitle, streakData, isTodayComplete, currentPodcastId, currentPodcast, isPlaying, isPlayerExpanded,
    setIsPlayerExpanded, customArtwork, playbackRate,
    setPlaybackRate, activePlayerTime, isSettingsOpen, setIsSettingsOpen, hideCompleted,
    setHideCompleted, reviewModeEnabled, setReviewModeEnabled, completionSound, setCompletionSound, useCollectionsView,
    setUseCollectionsView, playOnNavigate, setPlayOnNavigate, playerLayout, setPlayerLayout, lastPlayedCollectionId, setLastPlayedCollectionId, handleSetCustomArtwork, dataToExport, theme,
    setTheme, setLanguage, setStreakData, setPodcasts, setCollections, unrecordCompletion, recordCompletion,
    allPodcastsSorted, podcastsInCurrentView, reviewPrompt, setReviewPrompt, setNextPodcastOnEnd, isCategorizeModalOpen,
    setIsCategorizeModalOpen, podcastsToCategorize, setPodcastsToCategorize, isCreateCollectionModalOpen,
    setIsCreateCollectionModalOpen, currentView, setCurrentView, isClearDataModalOpen,
    setIsClearDataModalOpen, isLoading, isPlaybackLoading, onFileUpload, onDeletePodcast, onDeleteCollection, onResetProgress, onClearLocalFiles, onResetPreloaded, onClearAll, onUpdatePreloadedData, totalStorageUsed,
    onSelectPodcast, onTogglePlayPause, onSkip, onSeek, showPlaybackSpeedControl, setShowPlaybackSpeedControl
  } = props;

  const { t } = useTranslation();

  const visiblePodcasts = useMemo(() => {
      if (hideCompleted) {
          return podcastsInCurrentView.filter(p => !p.isListened);
      }
      return podcastsInCurrentView;
  }, [podcastsInCurrentView, hideCompleted]);
  
  const { listenedCount, totalCount, percentage } = useMemo(() => {
    const targetPodcasts = podcastsInCurrentView;
    const listened = targetPodcasts.filter(p => p.isListened).length;
    const total = targetPodcasts.length;
    return {
      listenedCount: listened,
      totalCount: total,
      percentage: total > 0 ? (listened / total) * 100 : 0,
    };
  }, [podcastsInCurrentView]);

  const currentCollectionName = useMemo(() => {
      if (!currentView) return null;
      if (currentView === 'uncategorized') return t('collection.uncategorized');
      return collections.find(c => c.id === currentView)?.name || null;
  }, [currentView, collections, t]);
  
  const currentCollection = useMemo(() => {
    if (!currentView || currentView === 'uncategorized') return null;
    return collections.find(c => c.id === currentView);
  }, [currentView, collections]);

  const collectionArtworkUrl = currentCollection?.artworkUrl;

  const handleExportData = () => {
    const dataStr = JSON.stringify(dataToExport, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = 'audio_player_backup.json';
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };
  
  const handleTogglePodcastComplete = useCallback((id: string) => {
    let wasCompleted = false;
    const updatedPodcasts = podcasts.map(p => {
        if (p.id === id) {
            wasCompleted = p.isListened;
            return { ...p, isListened: !p.isListened, progress: p.isListened ? 0 : p.duration };
        }
        return p;
    });
    setPodcasts(updatedPodcasts);
    
    if (streakData.enabled && streakData.difficulty !== 'easy') {
        if (wasCompleted) {
            unrecordCompletion(id);
        } else {
            recordCompletion(id);
        }
    }
  }, [podcasts, setPodcasts, streakData.enabled, streakData.difficulty, recordCompletion, unrecordCompletion]);

  const handleMovePodcastToCollection = useCallback((podcastId: string, collectionId: string | null) => {
    const updatedPodcasts = podcasts.map(p => p.id === podcastId ? { ...p, collectionId } : p);
    setPodcasts(updatedPodcasts);
  }, [podcasts, setPodcasts]);
  
  const handleCategorizeAssign = (collectionId: string) => {
    const idsToAssign = new Set(podcastsToCategorize.map(p => p.id));
    const updatedPodcasts = podcasts.map(p => idsToAssign.has(p.id) ? { ...p, collectionId } : p);
    setPodcasts(updatedPodcasts);
    setIsCategorizeModalOpen(false);
    setPodcastsToCategorize([]);
  };

  const handleCategorizeCreateAndAssign = (name: string) => {
    const newId = uuidv4();
    setCollections([...collections, { id: newId, name }]);
    handleCategorizeAssign(newId);
  };
  
  const handleCreateCollection = (name: string) => {
    const newId = uuidv4();
    setCollections([...collections, { id: newId, name }]);
  };
  
  const handleRenameCollection = (id: string, newName: string) => {
    setCollections(collections.map(c => c.id === id ? { ...c, name: newName } : c));
  };
  
  const handlePlayCollection = (collectionId: string | null) => {
     setLastPlayedCollectionId(collectionId);
     const podcastsInCollection = allPodcastsSorted.filter(p => p.collectionId === collectionId && !p.isListened);
     if (podcastsInCollection.length > 0) {
        onSelectPodcast(podcastsInCollection[0].id);
     } else {
        alert("No unplayed audio in this collection.");
     }
  };

  const handleSetCollectionArtwork = useCallback((collectionId: string, url: string | null) => {
    setCollections(collections.map(c => {
      if (c.id === collectionId) {
        const newCollection = { ...c };
        if (url) {
          newCollection.artworkUrl = url;
        } else {
          delete newCollection.artworkUrl;
        }
        return newCollection;
      }
      return c;
    }));
  }, [collections, setCollections]);
  
  const handleResetCollectionProgress = useCallback((collectionId: string | null) => {
    const podcastsToReset = podcasts.filter(p => {
        if (collectionId === null) return p.collectionId === null; // Handle uncategorized explicitly
        return p.collectionId === collectionId;
    });

    const updatedPodcasts = podcasts.map(p => {
        const shouldReset = (collectionId === null && p.collectionId === null) || p.collectionId === collectionId;
        if (shouldReset) {
            return { ...p, progress: 0, isListened: false };
        }
        return p;
    });

    setPodcasts(updatedPodcasts);

    if (streakData.enabled && streakData.difficulty !== 'easy') {
        podcastsToReset.forEach(p => {
            if (p.isListened) {
                unrecordCompletion(p.id);
            }
        });
    }
  }, [podcasts, setPodcasts, streakData, unrecordCompletion]);

  const showCollections = useCollectionsView && currentView === null;

  const firstUnplayedInView = useMemo(() => {
    if (!useCollectionsView || !currentView) return null;
    const collectionId = currentView === 'uncategorized' ? null : currentView;
    return allPodcastsSorted.find(p => p.collectionId === collectionId && !p.isListened);
  }, [allPodcastsSorted, useCollectionsView, currentView]);

  return (
    <>
      <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          onResetProgress={onResetProgress}
          onOpenClearDataModal={() => setIsClearDataModalOpen(true)}
          currentTheme={theme}
          onSetTheme={setTheme}
          onSetLanguage={setLanguage}
          streakData={streakData}
          onSetStreakData={setStreakData}
          hideCompleted={hideCompleted}
          onSetHideCompleted={setHideCompleted}
          reviewModeEnabled={reviewModeEnabled}
          onSetReviewModeEnabled={setReviewModeEnabled}
          customArtwork={customArtwork}
          onSetCustomArtwork={handleSetCustomArtwork}
          onExportData={handleExportData}
          onImportData={onImportData}
          completionSound={completionSound}
          onSetCompletionSound={setCompletionSound}
          useCollectionsView={useCollectionsView}
          onSetUseCollectionsView={setUseCollectionsView}
          playOnNavigate={playOnNavigate}
          onSetPlayOnNavigate={setPlayOnNavigate}
          playerLayout={playerLayout}
          onSetPlayerLayout={setPlayerLayout}
          totalStorageUsed={totalStorageUsed}
          user={user}
          onLogout={onLogout}
          onUpdatePreloadedData={onUpdatePreloadedData}
          podcasts={podcasts}
          collections={collections}
          setPodcasts={setPodcasts}
      />

       <ReviewModal
        isOpen={reviewPrompt.show}
        podcastName={reviewPrompt.podcastToReview?.name || ''}
        onConfirm={() => {
          if (reviewPrompt.podcastToReview && reviewPrompt.podcastToPlay) {
            setNextPodcastOnEnd(reviewPrompt.podcastToPlay.id);
            onSelectPodcast(reviewPrompt.podcastToReview.id);
          }
          setReviewPrompt({ show: false, podcastToReview: null, podcastToPlay: null });
        }}
        onCancel={() => {
          if (reviewPrompt.podcastToPlay) {
            onSelectPodcast(reviewPrompt.podcastToPlay.id);
          }
          setReviewPrompt({ show: false, podcastToReview: null, podcastToPlay: null });
        }}
      />
      
      <CategorizeModal
        isOpen={isCategorizeModalOpen}
        onClose={() => setIsCategorizeModalOpen(false)}
        collections={collections}
        podcastCount={podcastsToCategorize.length}
        onAssign={handleCategorizeAssign}
        onCreateAndAssign={handleCategorizeCreateAndAssign}
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

      <div className={`max-w-4xl mx-auto p-4 sm:p-6 pb-28 min-h-screen transition-opacity duration-300 ${isPlayerExpanded ? 'opacity-0' : 'opacity-100'}`}>
          <Header
              title={title}
              onSetTitle={setTitle}
              onFileUpload={onFileUpload}
              onOpenSettings={() => setIsSettingsOpen(true)}
              isLoading={isLoading}
          />
          <main>
              {streakData.enabled && <StreakTracker streakData={streakData} isTodayComplete={isTodayComplete} />}
              
              <div className="mt-6">
                {showCollections ? (
                  <>
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-xl font-bold text-brand-text">{t('main.collections')}</h2>
                      <button
                          onClick={() => setIsCreateCollectionModalOpen(true)}
                          className="flex items-center gap-2 text-sm px-3 py-2 bg-brand-surface-light hover:bg-opacity-75 rounded-md transition-colors duration-200 b-border b-shadow-hover"
                        >
                        <PlusIcon size={16}/> {t('main.newCollection')}
                        </button>
                    </div>
                    <div className="mt-4 ">
                      <CollectionList
                          collections={collections}
                          podcasts={podcasts}
                          onNavigateToCollection={(id) => {
                            setCurrentView(id);
                            if (playOnNavigate) {
                                const collectionId = id === 'uncategorized' ? null : id;
                                const firstUnplayed = allPodcastsSorted.find(p => p.collectionId === collectionId && !p.isListened);
                                if (firstUnplayed) {
                                    onSelectPodcast(firstUnplayed.id);
                                }
                            }
                            window.scrollTo(0, 0);
                          }}
                          onPlayCollection={handlePlayCollection}
                          onRenameCollection={handleRenameCollection}
                          onDeleteCollection={onDeleteCollection}
                          onResetCollectionProgress={(id) => handleResetCollectionProgress(id === 'uncategorized' ? null : id)}
                          onSetCollectionArtwork={handleSetCollectionArtwork}
                          lastPlayedCollectionId={lastPlayedCollectionId}
                          theme={theme}
                        />
                    </div>
                  </>
                ) : (
                  <div>
                      <div className="flex justify-between items-center mb-4 gap-4">
                          <div className="flex-1">
                              {currentView && (
                                  <button onClick={() => setCurrentView(null)} className="flex items-center gap-1 text-brand-text-secondary hover:text-brand-text p-2 -ml-2">
                                      <ChevronLeftIcon size={20} />
                                      <span className="hidden sm:inline">{t('main.backToCollections')}</span>
                                  </button>
                              )}
                          </div>
                          <h2 className="flex-shrink text-xl font-bold text-brand-text text-center truncate">{currentCollectionName || t('main.allAudio')}</h2>
                          <div className="flex-1 flex justify-end" />
                      </div>

                    {firstUnplayedInView && (
                      <div className="my-4">
                        <button
                          onClick={() => onSelectPodcast(firstUnplayedInView.id)}
                          onTouchEnd={(e) => { e.preventDefault(); onSelectPodcast(firstUnplayedInView.id); }}
                          className="w-full flex items-center justify-center gap-3 text-lg py-3 px-6 bg-brand-primary text-brand-text-on-primary rounded-lg b-border b-shadow b-shadow-hover transition-transform transform hover:scale-[1.02] active:scale-[0.98]"
                        >
                          <PlayCircleIcon size={24} />
                          <span className="font-bold">{t('main.continueLearning')}</span>
                        </button>
                      </div>
                    )}

                    {playerLayout !== 'pimsleur' && totalCount > 0 && !showCollections && <StatusBar listenedCount={listenedCount} totalCount={totalCount} percentage={percentage} />}
                    
                    <div className={`mt-4 ${playerLayout !== 'pimsleur' ? 'bg-brand-surface rounded-lg shadow-lg b-border b-shadow' : ''}`}>
                        {visiblePodcasts.length > 0 ? (
                            <PodcastList
                                podcasts={visiblePodcasts}
                                currentPodcastId={currentPodcastId}
                                isPlaying={isPlaying}
                                onSelectPodcast={onSelectPodcast}
                                onDeletePodcast={onDeletePodcast}
                                onTogglePodcastComplete={handleTogglePodcastComplete}
                                onMovePodcastToCollection={handleMovePodcastToCollection}
                                hideCompleted={hideCompleted}
                                activePlayerTime={activePlayerTime}
                                collections={collections}
                                useCollectionsView={useCollectionsView}
                                playerLayout={playerLayout}
                                collectionArtworkUrl={collectionArtworkUrl}
                                theme={theme}
                            />
                        ) : (
                            <div className="text-center p-12 text-brand-text-secondary">
                                <p className="font-semibold">{t('main.noAudio')}</p>
                                <p className="text-sm mt-1">{hideCompleted ? t('main.noAudioCompleted') : t('main.noAudioUpload')}</p>
                            </div>
                        )}
                    </div>
                  </div>
                )}
              </div>
          </main>
      </div>
       {currentPodcast && (
            <Player
                podcast={currentPodcast}
                isPlaying={isPlaying}
                isPlayerExpanded={isPlayerExpanded}
                setIsPlayerExpanded={setIsPlayerExpanded}
                artworkUrl={
                  (useCollectionsView &&
                    collections.find(c => c.id === currentPodcast.collectionId)?.artworkUrl
                  ) || customArtwork
                }
                playbackRate={playbackRate}
                onPlaybackRateChange={setPlaybackRate}
                currentTime={activePlayerTime}
                layoutMode={playerLayout}
                setPlayerLayout={setPlayerLayout}
                showPlaybackSpeedControl={showPlaybackSpeedControl}
                setShowPlaybackSpeedControl={setShowPlaybackSpeedControl}
                isLoading={isPlaybackLoading}
                onTogglePlayPause={onTogglePlayPause}
                onSkip={onSkip}
                onSeek={onSeek}
            />
        )}
    </>
  );
};

export default AppUI;