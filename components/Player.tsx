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

  const handleAudioError = useCallback(() => {
    console.error(`Failed to load audio source for: ${podcast.name}`);
    alert(`Error: Could not load audio for "${podcast.name}". The source might be unavailable or the format is not supported.`);
    setIsLoading(false);
    setIsPlaying(false);
  }, [podcast.name, setIsPlaying]);

  // Effect 1: Load the audio source when the podcast changes.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    let objectUrl: string | undefined;

    const loadSource = async () => {
      setIsLoading(true);
      audio.pause();

      let src;
      if (podcast.storage === 'indexeddb') {
        try {
          const blob = await db.getAudio(podcast.id);
          if (!blob) throw new Error('Blob not found in IndexedDB');
          objectUrl = URL.createObjectURL(blob);
          src = objectUrl;
        } catch (e) {
          console.error(e);
          handleAudioError();
          return;
        }
      } else {
        src = podcast.url;
      }

      audio.src = src;
      audio.load();
    };

    loadSource();

    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [podcast.id, podcast.storage, podcast.url, reloadKey, handleAudioError]);

  // Effect 2: Sync playback rate to the audio element.
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  // --- UI Event Handlers ---
  const handleTogglePlayPause = useCallback((e?: React.MouseEvent | React.TouchEvent) => {
    e?.stopPropagation();
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          if (error.name === 'NotAllowedError') {
            console.warn("Playback was prevented by the browser. This can happen on mobile if play() is not called directly in a user event handler.");
            setIsPlaying(false);
          } else if (error.name !== 'AbortError') {
            console.error("Error playing audio:", error);
            handleAudioError();
          }
        });
      }
      setIsPlaying(true);
    }
  }, [isPlaying, setIsPlaying, handleAudioError]);

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
    if (isFinite(currentTime)) {
      audio.currentTime = currentTime;
    }
    if (!podcast.duration || podcast.duration === 0) onDurationFetch(podcast.id, audio.duration);
    audio.playbackRate = playbackRate;
  };

  const handleCanPlay = () => {
    setIsLoading(false);
  };

  const handleWaiting = () => {
    if (isPlaying) setIsLoading(true);
  };

  const handlePlaying = () => {
    setIsLoading(false);
  };

  const handleAudioEnded = useCallback(() => {
    if (progressUpdateDebounceRef.current) clearTimeout(progressUpdateDebounceRef.current);
    if (podcast.duration > 0) onProgressSave(podcast.id, podcast.duration);
    onEnded();
  }, [podcast.id, podcast.duration, onProgressSave, onEnded]);

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const progressPercent = podcast?.duration && podcast.duration > 0 ? (currentTime / podcast.duration) * 100 : 0;
  const animatedBackgroundStyle: React.CSSProperties = { background: `linear-gradient(${progressPercent * 3.6}deg, var(--brand-gradient-start), var(--brand-gradient-end))`, transition: 'background 1s linear' };

  // --- Sub-components ---
  const PimsleurCircularPlayer = () => (
    <div className="pimsleur-player" onTouchMove={handleTouchMove}>
      <div className="circular-player">
        <button className="skip-button" onClick={(e) => handleSkip(-10, e)} onTouchEnd={(e) => handleSkip(-10, e)}>-10s</button>
        <button
          className="play-pause-button"
          onClick={handleTogglePlayPause}
          onTouchEnd={handleTouchEndTogglePlayPause}
        >
          {isPlaying ? <PauseIcon /> : <PlayIcon />}
        </button>
        <button className="skip-button" onClick={(e) => handleSkip(10, e)} onTouchEnd={(e) => handleSkip(10, e)}>+10s</button>
      </div>
    </div>
  );

  const DefaultExpandedPlayer = () => (
    <div className="expanded-player">
      <div className="header">
        <button onClick={() => setIsPlayerExpanded(false)}><ChevronDownIcon /></button>
        <span>{podcast.name}</span>
        <button onClick={() => setIsSettingsMenuOpen(!isSettingsMenuOpen)}><SettingsIcon /></button>
      </div>
      {artworkUrl && <img src={artworkUrl} alt="Artwork" className="artwork" />}
      <div className="controls">
        <button onClick={(e) => handleSkip(-10, e)}>-10s</button>
        <button onClick={handleTogglePlayPause}>{isPlaying ? <PauseIcon /> : <PlayIcon />}</button>
        <button onClick={(e) => handleSkip(10, e)}>+10s</button>
      </div>
      <div className="progress-bar" onClick={handleSeek}>
        <div className="progress" style={{ width: `${progressPercent}%` }} />
      </div>
      <div className="time-display">
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(podcast.duration || 0)}</span>
      </div>
      {showPlaybackSpeedControl && (
        <button onClick={handleCycleSpeed}>{playbackRate}x</button>
      )}
      {isSettingsMenuOpen && (
        <div className="settings-menu">
          <button onClick={handleReloadAudio}><RedoIcon /> Reload Audio</button>
          <button onClick={() => setPlayerLayout(layoutMode === 'pimsleur' ? 'default' : 'pimsleur')}><SyncIcon /> Toggle Layout</button>
          <ToggleSwitch
            label="Show Speed Control"
            checked={showPlaybackSpeedControl}
            onChange={setShowPlaybackSpeedControl}
          />
        </div>
      )}
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

      {isPlayerExpanded ? (
        layoutMode === 'pimsleur' ? <PimsleurCircularPlayer /> : <DefaultExpandedPlayer />
      ) : (
        <div className="collapsed-player" onClick={() => setIsPlayerExpanded(true)}>
          <div className="collapsed-info">
            {artworkUrl && <img src={artworkUrl} alt="Artwork" className="collapsed-artwork" />}
            <span>{podcast.name}</span>
          </div>
          <button onClick={handleTogglePlayPause}>{isPlaying ? <PauseIcon /> : <PlayIcon />}</button>
        </div>
      )}
    </>
  );
};

export default Player;
