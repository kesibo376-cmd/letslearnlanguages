import React, { useRef, useEffect, useState, useCallback } from 'react';
import type { Podcast, LayoutMode } from '../types';
import { formatTime } from '../lib/utils';
import * as db from '../lib/db';
import PlayIcon from './icons/PlayIcon';
import PauseIcon from './icons/PauseIcon';
import ChevronDownIcon from './icons/ChevronDownIcon';
import RedoIcon from './icons/RedoIcon';
import SettingsIcon from './icons/SettingsIcon';
import ToggleSwitch from './ToggleSwitch';

interface PlayerProps {
  podcast: Podcast;
  isPlaying: boolean;
  setIsPlaying: (update: React.SetStateAction<boolean>) => void;
  onProgressSave: (id: string, progress: number) => void;
  onEnded: () => void;
  isPlayerExpanded: boolean;
  // Fix: Correctly type the state setter to allow functional updates.
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
  const [audioSrc, setAudioSrc] = useState<string | undefined>(undefined);
  const [isLoadingSrc, setIsLoadingSrc] = useState(true);
  const [isSettingsMenuOpen, setIsSettingsMenuOpen] = useState(false);

  // --- Audio Loading ---
  useEffect(() => {
    let objectUrl: string | undefined;

    const loadAudio = async () => {
      setIsLoadingSrc(true);
      if (podcast.storage === 'indexeddb') {
        try {
          const blob = await db.getAudio(podcast.id);
          if (blob) {
            objectUrl = URL.createObjectURL(blob);
            setAudioSrc(objectUrl);
          } else {
            throw new Error('Audio not found in local storage.');
          }
        } catch (error) {
          console.error("Error loading audio from IndexedDB:", error);
          alert("Could not load audio file. It may have been deleted.");
          setAudioSrc(undefined);
        }
      } else {
        setAudioSrc(podcast.url);
      }
      setIsLoadingSrc(false);
    };

    loadAudio();

    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [podcast.id, podcast.url, podcast.storage]);

  // --- Robust Playback Control Effect ---
  // This is the single source of truth for commanding the audio element.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || isLoadingSrc) return;

    if (isPlaying) {
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.error("Audio playback failed:", error);
          // If play is rejected, sync the state back to false.
          setIsPlaying(false);
        });
      }
    } else {
      audio.pause();
    }
  }, [isPlaying, isLoadingSrc, setIsPlaying]);
  
  // --- Audio Properties Effect ---
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  // --- State Handlers (for UI events) ---
  const handleTogglePlayPause = useCallback((e?: React.MouseEvent | React.TouchEvent) => {
    e?.stopPropagation();
    setIsPlaying(p => !p);
  }, [setIsPlaying]);

  // Handler for touch events to prevent issues like long-press not firing click on mobile.
  const handleTouchEndTogglePlayPause = useCallback((e: React.TouchEvent) => {
    e.preventDefault(); // Prevents the browser from firing a 'click' event after the touch.
    handleTogglePlayPause(e);
  }, [handleTogglePlayPause]);


  // --- Keyboard Shortcuts ---
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignore key presses if the user is typing in an input field.
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable
      ) {
        return;
      }
      
      if (event.key.toLowerCase() === 'f') {
        event.preventDefault();
        // Toggles between mini-player and expanded player
        setIsPlayerExpanded(prev => !prev);
      } else if (event.key === ' ' && isPlayerExpanded) {
        // Toggles play/pause only when player is expanded
        event.preventDefault(); // Prevent page from scrolling
        handleTogglePlayPause();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isPlayerExpanded, setIsPlayerExpanded, handleTogglePlayPause]);

  const handleSkip = useCallback((seconds: number, e?: React.MouseEvent | React.TouchEvent) => {
    e?.stopPropagation();
    if (!audioRef.current) return;
    const newTime = Math.max(0, Math.min(podcast.duration || 0, audioRef.current.currentTime + seconds));
    audioRef.current.currentTime = newTime;
    onCurrentTimeUpdate(newTime);
    onProgressSave(podcast.id, newTime); // Save immediately on skip
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

  // --- Audio Element Event Listeners ---
  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    const newTime = audioRef.current.currentTime;
    onCurrentTimeUpdate(newTime);

    if (progressUpdateDebounceRef.current) {
      clearTimeout(progressUpdateDebounceRef.current);
    }
    progressUpdateDebounceRef.current = window.setTimeout(() => {
      onProgressSave(podcast.id, audioRef.current?.currentTime || 0);
    }, 1000);
  };
  
  const handleLoadedMetadata = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (!podcast.duration || podcast.duration === 0) {
      onDurationFetch(podcast.id, audio.duration);
    }
    // Restore state from props. `currentTime` is the source of truth.
    audio.currentTime = currentTime;
    audio.playbackRate = playbackRate;
  };

  const handleAudioEnded = useCallback(() => {
    // Cancel any pending debounced progress updates to prevent a race condition
    // where a stale progress update might overwrite the completed state.
    if (progressUpdateDebounceRef.current) {
      clearTimeout(progressUpdateDebounceRef.current);
    }
    // Fire one last progress update to ensure the audio is marked as complete
    // and the completion is recorded for streaks. The parent's onEnded handler
    // will then reset the progress to 0 for replayability.
    if (podcast.duration > 0) {
      onProgressSave(podcast.id, podcast.duration);
    }
    onEnded();
  }, [podcast.id, podcast.duration, onProgressSave, onEnded]);

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    // When the player is expanded, prevent default touch actions like scrolling
    // to make it a "no scroll zone".
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
            <button onClick={handleTogglePlayPause} onTouchEnd={handleTouchEndTogglePlayPause} className="bg-brand-primary text-brand-text-on-primary rounded-full p-5 z-10 b-border b-shadow hover:bg-brand-primary-hover transition-transform transform active:scale-95 sm:scale-100 scale-110">
              {isPlaying ? <PauseIcon size={32} /> : <PlayIcon size={32} />}
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
        <div className={`w-56 h-56 sm:w-64 sm:h-64 md:w-80 md:h-80 bg-brand-surface rounded-lg shadow-2xl overflow-hidden b-border b-shadow transition-transform ${isPlaying ? 'animate-pulse-slow' : ''}`}>
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
          <button onClick={handleTogglePlayPause} onTouchEnd={handleTouchEndTogglePlayPause} className="bg-brand-primary text-brand-text-on-primary rounded-full p-5 z-10 hover:bg-brand-primary-hover transition-transform transform active:scale-95 sm:scale-100 scale-110 b-border b-shadow">
            {isPlaying ? <PauseIcon size={32} /> : <PlayIcon size={32} />}
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
      <audio ref={audioRef} src={audioSrc} onTimeUpdate={handleTimeUpdate} onEnded={handleAudioEnded} onLoadedMetadata={handleLoadedMetadata} preload="metadata" />
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
              <button onClick={handleTogglePlayPause} onTouchEnd={handleTouchEndTogglePlayPause} className="bg-brand-primary text-brand-text-on-primary rounded-full p-2 hover:bg-brand-primary-hover transition-transform transform active:scale-95 b-border b-shadow">
                {isPlaying ? <PauseIcon size={20} /> : <PlayIcon size={20} />}
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