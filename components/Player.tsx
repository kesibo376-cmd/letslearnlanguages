import React, { useRef, useEffect, useState, useCallback } from 'react';
import type { Podcast, LayoutMode } from '../types';
import { formatTime } from '../lib/utils';
import * as db from '../lib/db';
import PlayIcon from './icons/PlayIcon';
import PauseIcon from './icons/PauseIcon';
import ChevronDownIcon from './icons/ChevronDownIcon';
import RedoIcon from './icons/RedoIcon';
import SettingsIcon from './icons/SettingsIcon';
import SyncIcon from './icons/SyncIcon';
import ToggleSwitch from './ToggleSwitch';
import { useDebug } from '../contexts/DebugContext';

interface PlayerProps {
  podcast: Podcast;
  isPlaying: boolean;
  setIsPlaying: (update: React.SetStateAction<boolean>) => void;
  onProgressSave: (id: string, progress: number) => void;
  onEnded: () => void;
  isPlayerExpanded: boolean;
  setIsPlayerExpanded: (update: React.SetStateAction<boolean>) => void;
  artworkUrl?: string | null;
  playbackRate: number;
  onPlaybackRateChange: (rate: number) => void;
  currentTime: number;
  onCurrentTimeUpdate: (time: number) => void;
  userId: string;
  onDurationFetch: (id: string, duration: number) => void;
  layoutMode: LayoutMode;
  setPlayerLayout: (layout: LayoutMode) => void;
  showPlaybackSpeedControl: boolean;
  setShowPlaybackSpeedControl: (value: boolean) => void;
}

const PLAYBACK_RATES = [0.75, 1, 1.25, 1.5, 2];

const Player: React.FC<PlayerProps> = ({
  podcast,
  isPlaying,
  setIsPlaying,
  onProgressSave,
  onEnded,
  isPlayerExpanded,
  setIsPlayerExpanded,
  artworkUrl,
  playbackRate,
  onPlaybackRateChange,
  currentTime,
  onCurrentTimeUpdate,
  onDurationFetch,
  layoutMode,
  setPlayerLayout,
  showPlaybackSpeedControl,
  setShowPlaybackSpeedControl,
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressUpdateDebounceRef = useRef<number | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [isSettingsMenuOpen, setIsSettingsMenuOpen] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const { log } = useDebug();

  const handleAudioError = useCallback(() => {
    const audio = audioRef.current;
    const error = audio ? audio.error : new Error('Audio element not available');
    
    const errorCode = error && 'code' in error ? error.code : 'N/A';
    const errorMessage = error?.message || 'Unknown error';
    log(`[Player Error] Failed to load: ${podcast.name}. Code: ${errorCode}. Message: ${errorMessage}`);
    
    alert(`Error: Could not load audio for "${podcast.name}". Code: ${errorCode}. Message: ${errorMessage}. Check console for more details.`);
    setIsLoading(false);
    setIsPlaying(false);
  }, [podcast.name, setIsPlaying, log]);

  // Effect 1: Load the audio source when the podcast changes.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    
    log(`[Player] Effect triggered to load new podcast: "${podcast.name}"`);
    let objectUrl: string | undefined;

    const loadSource = async () => {
      log(`[Player] loadSource() started for "${podcast.name}" (id: ${podcast.id})`);
      setIsLoading(true);
      audio.pause();

      let src;
      if (podcast.storage === 'indexeddb') {
        try {
          log(`[Player] Getting audio blob from IndexedDB for id: ${podcast.id}`);
          const blob = await db.getAudio(podcast.id);
          if (!blob) {
            log('[Player Error] Blob not found in IndexedDB');
            throw new Error('Blob not found in IndexedDB');
          }
          objectUrl = URL.createObjectURL(blob);
          src = objectUrl;
          log(`[Player] Created object URL from blob: ${src}`);
        } catch (e: any) {
          log(`[Player] Error loading from IndexedDB: ${e.message}`);
          handleAudioError();
          return;
        }
      } else {
        src = podcast.url;
        log(`[Player] Using preloaded URL: ${src}`);
      }

      audio.src = src;
      log(`[Player] Set audio.src. Now calling audio.load().`);
      audio.load();
    };

    loadSource();

    return () => {
      log(`[Player] Cleanup effect for "${podcast.name}"`);
      if (objectUrl) {
        log(`[Player] Revoking object URL: ${objectUrl}`);
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [podcast.id, podcast.storage, podcast.url, reloadKey, handleAudioError, log]);

  // Effect 2: The single source of truth for commanding the audio element.
  // It syncs the audio element's state to the app's `isPlaying` and `playbackRate` state.
  useEffect(() => {
    const audio = audioRef.current;
    // Guard against running before the audio element is ready or while it's loading a new source.
    if (!audio || isLoading) return;

    log(`[Player Sync] Syncing playback state. isPlaying: ${isPlaying}, audio.paused: ${audio.paused}`);
    
    audio.playbackRate = playbackRate;

    if (isPlaying) {
        if (audio.paused) {
            log('[Player Sync] State is playing but audio is paused. Calling play().');
            const playPromise = audio.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    if (error.name === 'NotAllowedError') {
                        log("[Player Sync] Autoplay was prevented by browser. Reverting isPlaying state.");
                        setIsPlaying(false);
                    } else {
                        log(`[Player Sync] Error during play(): ${error.name} - ${error.message}`);
                    }
                });
            }
        }
    } else {
        if (!audio.paused) {
            log('[Player Sync] State is not playing but audio is running. Calling pause().');
            audio.pause();
        }
    }
  }, [isPlaying, playbackRate, isLoading, setIsPlaying, log]);


  // --- UI Event Handlers ---
  const handleTogglePlayPause = useCallback((e?: React.MouseEvent | React.TouchEvent) => {
    e?.stopPropagation();
    log('[Player Action] handleTogglePlayPause called. Toggling isPlaying state.');
    // This handler's only job is to update the state. The useEffect hook will handle the side effect.
    setIsPlaying(p => !p);
  }, [setIsPlaying, log]);

  const handleTouchEndTogglePlayPause = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    handleTogglePlayPause(e);
  }, [handleTogglePlayPause]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.isContentEditable) return;
      if (event.key.toLowerCase() === 'f') {
        event.preventDefault();
        setIsPlayerExpanded(prev => !prev);
      } else if (event.key === ' ' && isPlayerExpanded) {
        event.preventDefault();
        handleTogglePlayPause();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isPlayerExpanded, setIsPlayerExpanded, handleTogglePlayPause]);

  const handleSkip = useCallback((seconds: number, e?: React.MouseEvent | React.TouchEvent) => {
    e?.stopPropagation();
    if (!audioRef.current) return;
    const newTime = Math.max(0, Math.min(podcast.duration || 0, audioRef.current.currentTime + seconds));
    audioRef.current.currentTime = newTime;
    onCurrentTimeUpdate(newTime);
    onProgressSave(podcast.id, newTime);
  }, [podcast.id, podcast.duration, onCurrentTimeUpdate, onProgressSave]);

  const handleSeek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (!audioRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const newTime = ((e.clientX - rect.left) / rect.width) * (podcast.duration || 0);
    audioRef.current.currentTime = newTime;
    onCurrentTimeUpdate(newTime);
    onProgressSave(podcast.id, newTime);
  }, [podcast.id, podcast.duration, onCurrentTimeUpdate, onProgressSave]);

  const handleCycleSpeed = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    const currentIndex = PLAYBACK_RATES.indexOf(playbackRate);
    const nextIndex = (currentIndex + 1) % PLAYBACK_RATES.length;
    onPlaybackRateChange(PLAYBACK_RATES[nextIndex]);
  }, [playbackRate, onPlaybackRateChange]);

  const handleReloadAudio = useCallback(() => {
    setIsSettingsMenuOpen(false);
    setReloadKey(k => k + 1);
  }, []);

  // --- Audio Element Event Listeners ---
  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    const newTime = audioRef.current.currentTime;
    onCurrentTimeUpdate(newTime);
    if (progressUpdateDebounceRef.current) clearTimeout(progressUpdateDebounceRef.current);
    progressUpdateDebounceRef.current = window.setTimeout(() => {
      onProgressSave(podcast.id, audioRef.current?.currentTime || 0);
    }, 1000);
  };

  const handleLoadedMetadata = () => {
    const audio = audioRef.current;
    if (!audio) return;
    log(`[Player Event] onLoadedMetadata. Duration: ${audio.duration}`);
    if (isFinite(currentTime)) {
      audio.currentTime = currentTime;
    }
    if (!podcast.duration || podcast.duration === 0) onDurationFetch(podcast.id, audio.duration);
    audio.playbackRate = playbackRate;
  };
  
  const handleCanPlay = () => {
    setIsLoading(false);
    log('[Player Event] onCanPlay. Ready to play.');
  };
  
  const handleWaiting = () => {
    if (isPlaying) {
      setIsLoading(true);
      log('[Player Event] onWaiting. Buffering...');
    }
  };

  const handlePlaying = () => {
    setIsLoading(false);
    log('[Player Event] onPlaying. Playback has started or resumed.');
  };

  const handleAudioEnded = useCallback(() => {
    if (progressUpdateDebounceRef.current) clearTimeout(progressUpdateDebounceRef.current);
    if (podcast.duration > 0) onProgressSave(podcast.id, podcast.duration);
    log(`[Player Event] onEnded for "${podcast.name}"`);
    onEnded();
  }, [podcast.id, podcast.duration, podcast.name, onProgressSave, onEnded, log]);

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const progressPercent = podcast?.duration && podcast.duration > 0 ? (currentTime / podcast.duration) * 100 : 0;
  const animatedBackgroundStyle: React.CSSProperties = { background: `linear-gradient(${progressPercent * 3.6}deg, var(--brand-gradient-start), var(--brand-gradient-end))`, transition: 'background 1s linear' };

  // --- Sub-components for different layouts ---
  const PimsleurCircularPlayer = () => {
    const size = 280, strokeWidth = 12, radius = (size - strokeWidth) / 2, circumference = 2 * Math.PI * radius;
    const offset = circumference - (progressPercent / 100) * circumference;
    return (
      <div className="flex-grow flex flex-col items-center justify-center text-center gap-8 w-full">
        <div className="relative" style={{ width: size, height: size }} data-no-drag="true">
          <svg width={size} height={size} className="transform -rotate-90">
            <circle cx={size / 2} cy={size / 2} r={radius} stroke="var(--brand-surface)" strokeWidth={strokeWidth} fill="transparent" />
            <circle cx={size / 2} cy={size / 2} r={radius} stroke="var(--brand-primary)" strokeWidth={strokeWidth} fill="transparent" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" className="transition-all duration-300 ease-linear" />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <h3 className="text-4xl font-bold text-brand-text mb-2">{formatTime((podcast.duration || 0) - currentTime)}</h3>
            <button onClick={handleTogglePlayPause} onTouchEnd={handleTouchEndTogglePlayPause} className="bg-brand-primary text-brand-text-on-primary rounded-full p-5 z-10 b-border b-shadow hover:bg-brand-primary-hover transition-transform transform active:scale-95 sm:scale-100 scale-110 flex items-center justify-center">
              {isLoading ? (
                <svg className="animate-spin h-8 w-8 text-brand-text-on-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : isPlaying ? <PauseIcon size={32} /> : <PlayIcon size={32} />}
            </button>
          </div>
        </div>
        <h2 className="text-2xl font-bold text-brand-text mt-4 px-4">{podcast.name}</h2>
        <div className="flex items-center justify-center gap-2 w-full max-w-sm" data-no-drag="true">
          <button onClick={(e) => handleSkip(-10, e)} onTouchStart={e => e.stopPropagation()} className="text-brand-text-secondary hover:text-brand-text p-4 rounded-full text-sm transform transition-transform hover:scale-110 active:scale-95">
            <RedoIcon size={24} className="backward -scale-x-100" />
          </button>
          {showPlaybackSpeedControl && (
            <button onClick={handleCycleSpeed} onTouchStart={e => e.stopPropagation()} className="text-brand-text font-semibold p-3 rounded-md w-24 text-center bg-brand-surface hover:bg-brand-surface-light transition-colors b-border transform hover:scale-105 active:scale-95">
              {playbackRate}x
            </button>
          )}
          <button onClick={(e) => handleSkip(10, e)} onTouchStart={e => e.stopPropagation()} className="text-brand-text-secondary hover:text-brand-text p-4 rounded-full text-sm transform transition-transform hover:scale-110 active:scale-95">
            <RedoIcon size={24} className="forward" />
          </button>
        </div>
      </div>
    );
  };

  const DefaultExpandedPlayer = () => (
      <div className="flex-grow flex flex-col items-center justify-center text-center gap-6 sm:gap-8">
        <div className={`w-56 h-56 sm:w-64 sm:h-64 md:w-80 md:h-80 bg-brand-surface rounded-lg shadow-2xl overflow-hidden b-border b-shadow transition-transform ${isPlaying && !isLoading ? 'animate-pulse-slow' : ''}`}>
          <img src={artworkUrl || 'https://i.imgur.com/Q3QfWqV.png'} alt={`Artwork for ${podcast.name}`} className="w-full h-full object-cover" />
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-brand-text">{podcast.name}</h2>
        <div className="w-full max-w-md px-4 sm:px-0" data-no-drag="true">
          <div className="w-full bg-brand-surface rounded-full h-1.5 cursor-pointer group b-border" onClick={handleSeek} onTouchStart={(e) => e.stopPropagation()}>
            <div className="bg-brand-primary h-full rounded-full transition-all duration-200 ease-linear" style={{ width: `${progressPercent}%` }} />
          </div>
          <div className="flex justify-between text-xs text-brand-text-secondary mt-1">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(podcast.duration || 0)}</span>
          </div>
        </div>
        <div className="flex items-center justify-center gap-2 w-full max-w-sm" data-no-drag="true">
          {showPlaybackSpeedControl && (
            <button onClick={handleCycleSpeed} onTouchStart={e => e.stopPropagation()} className="text-brand-text font-semibold p-2 rounded-md w-16 text-center bg-brand-surface hover:bg-brand-surface-light transition-colors b-border transform hover:scale-105 active:scale-95">
              {playbackRate}x
            </button>
          )}
          <button onClick={(e) => handleSkip(-10, e)} onTouchStart={e => e.stopPropagation()} className="text-brand-text-secondary hover:text-brand-text p-4 rounded-full text-sm transform transition-transform hover:scale-110 active:scale-95">
            <RedoIcon size={24} className="backward -scale-x-100" />
          </button>
          <button onClick={handleTogglePlayPause} onTouchEnd={handleTouchEndTogglePlayPause} className="bg-brand-primary text-brand-text-on-primary rounded-full p-5 z-10 hover:bg-brand-primary-hover transition-transform transform active:scale-95 sm:scale-100 scale-110 b-border b-shadow flex items-center justify-center">
             {isLoading ? (
                <svg className="animate-spin h-8 w-8 text-brand-text-on-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : isPlaying ? <PauseIcon size={32} /> : <PlayIcon size={32} />}
          </button>
          <button onClick={(e) => handleSkip(10, e)} onTouchStart={e => e.stopPropagation()} className="text-brand-text-secondary hover:text-brand-text p-4 rounded-full text-sm transform transition-transform hover:scale-110 active:scale-95">
            <RedoIcon size={24} className="forward" />
          </button>
          {showPlaybackSpeedControl && (
            <div className="w-16" aria-hidden="true" /> /* Spacer to balance speed button */
          )}
        </div>
      </div>
  );

  return (
    <>
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleAudioEnded}
        onLoadedMetadata={handleLoadedMetadata}
        onCanPlay={handleCanPlay}
        onWaiting={handleWaiting}
        onPlaying={handlePlaying}
        onError={handleAudioError}
        preload="auto"
      />
      <div className={`fixed left-0 right-0 z-20 transition-all duration-500 ease-in-out ${isPlayerExpanded ? 'bottom-0 top-0' : 'bottom-0'}`}>
        {/* Expanded Player */}
        <div className={`absolute inset-0 flex flex-col p-4 sm:p-8 transition-transform duration-300 ease-in-out ${isPlayerExpanded ? 'translate-y-0' : 'translate-y-full pointer-events-none'}`} onTouchMove={handleTouchMove}>
          <div className="absolute inset-0 -z-10 animated-player-bg" style={animatedBackgroundStyle} />
          {layoutMode === 'pimsleur' && artworkUrl && <img src={artworkUrl} alt="" className="absolute inset-0 w-full h-full object-cover -z-20 opacity-20" />}
          
          <div className="flex-shrink-0 flex justify-between items-center">
            <button onClick={() => setIsPlayerExpanded(false)} onTouchStart={e => e.stopPropagation()} className="text-brand-text-secondary hover:text-brand-text p-2 -ml-2">
              <ChevronDownIcon size={32} />
            </button>
            <button onClick={() => setIsSettingsMenuOpen(true)} onTouchStart={e => e.stopPropagation()} className="text-brand-text-secondary hover:text-brand-text p-2 -mr-2">
              <SettingsIcon size={28} />
            </button>
          </div>

          {isSettingsMenuOpen && (
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-20 animate-fade-in" onClick={() => setIsSettingsMenuOpen(false)} onTouchStart={e => e.stopPropagation()} onTouchMove={e => e.stopPropagation()} onTouchEnd={e => e.stopPropagation()}>
              <div className="bg-brand-surface rounded-lg p-6 w-full max-w-xs b-border b-shadow animate-scale-in" onClick={e => e.stopPropagation()}>
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="text-lg font-bold text-brand-text">Player Settings</h3>
                      <button onClick={() => setIsSettingsMenuOpen(false)} className="text-brand-text-secondary hover:text-brand-text text-2xl leading-none">&times;</button>
                  </div>
                  <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-brand-surface-light rounded-md b-border">
                          <label htmlFor="layout-toggle" className="font-semibold text-brand-text">Circular Player</label>
                          <ToggleSwitch isOn={layoutMode === 'pimsleur'} handleToggle={() => setPlayerLayout(layoutMode === 'pimsleur' ? 'default' : 'pimsleur')} />
                      </div>
                      <div className="flex items-center justify-between p-3 bg-brand-surface-light rounded-md b-border">
                          <label htmlFor="speed-toggle" className="font-semibold text-brand-text">Show Speed Control</label>
                          <ToggleSwitch isOn={showPlaybackSpeedControl} handleToggle={() => setShowPlaybackSpeedControl(!showPlaybackSpeedControl)} />
                      </div>
                      <button onClick={handleReloadAudio} className="w-full flex items-center justify-between p-3 bg-brand-surface-light rounded-md b-border text-left hover:bg-brand-surface transition-colors">
                          <div className="font-semibold text-brand-text">Refresh Player</div>
                          <SyncIcon size={20} className="text-brand-text-secondary"/>
                      </button>
                  </div>
              </div>
            </div>
          )}

          {layoutMode === 'pimsleur' ? <PimsleurCircularPlayer /> : <DefaultExpandedPlayer />}
        </div>
        
        {/* Mini Player */}
        <div className={`absolute bottom-0 left-0 right-0 bg-brand-surface-light shadow-2xl transition-transform duration-500 ease-in-out cursor-pointer b-border ${isPlayerExpanded ? 'translate-y-full' : 'translate-y-0'}`} onClick={() => setIsPlayerExpanded(true)} role="button" aria-label="Expand player">
          <div className="absolute top-0 left-0 w-full h-1 bg-brand-surface">
            <div className="bg-brand-primary h-full" style={{ width: `${progressPercent}%`, transition: 'width 0.2s linear' }} />
          </div>
          <div className="max-w-4xl mx-auto flex items-center gap-3 p-2 sm:p-3">
            <div className="w-12 h-12 flex-shrink-0 bg-brand-surface rounded-md overflow-hidden b-border">
              <img src={artworkUrl || 'https://i.imgur.com/Q3QfWqV.png'} alt={`Artwork for ${podcast.name}`} className="w-full h-full object-cover" />
            </div>
            <div className="flex-grow min-w-0">
              <p className="font-bold text-brand-text truncate">{podcast.name}</p>
              <p className="text-xs text-brand-text-secondary">{formatTime(currentTime)} / {formatTime(podcast.duration || 0)}</p>
            </div>
            <div className="flex-shrink-0 flex items-center gap-1 sm:gap-2">
              <button onClick={(e) => handleSkip(-10, e)} onTouchStart={e => e.stopPropagation()} className="text-brand-text-secondary hover:text-brand-text p-2 rounded-full text-sm transform transition-transform hover:scale-110 active:scale-95">
                <RedoIcon size={20} className="backward -scale-x-100" />
              </button>
              <button onClick={handleTogglePlayPause} onTouchEnd={handleTouchEndTogglePlayPause} className="bg-brand-primary text-brand-text-on-primary rounded-full p-2 hover:bg-brand-primary-hover transition-transform transform active:scale-95 b-border b-shadow w-9 h-9 flex items-center justify-center">
                {isLoading ? (
                  <svg className="animate-spin h-5 w-5 text-brand-text-on-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : isPlaying ? <PauseIcon size={20} /> : <PlayIcon size={20} />}
              </button>
              <button onClick={(e) => handleSkip(10, e)} onTouchStart={e => e.stopPropagation()} className="text-brand-text-secondary hover:text-brand-text p-2 rounded-full text-sm transform transition-transform hover:scale-110 active:scale-95">
                <RedoIcon size={20} className="forward" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Player;