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

  // (rest of your code remains EXACTLY the same...)

  return (
    <>
      <audio
        ref={audioRef}
        onTimeUpdate={() => {
          if (!audioRef.current) return;
          const newTime = audioRef.current.currentTime;
          onCurrentTimeUpdate(newTime);
          if (progressUpdateDebounceRef.current) clearTimeout(progressUpdateDebounceRef.current);
          progressUpdateDebounceRef.current = window.setTimeout(() => {
            onProgressSave(podcast.id, audioRef.current?.currentTime || 0);
          }, 1000);
        }}
        onEnded={() => {
          if (progressUpdateDebounceRef.current) clearTimeout(progressUpdateDebounceRef.current);
          if (podcast.duration > 0) onProgressSave(podcast.id, podcast.duration);
          onEnded();
        }}
        onLoadedMetadata={() => {
          const audio = audioRef.current;
          if (!audio) return;
          if (isFinite(currentTime)) {
            audio.currentTime = currentTime;
          }
          if (!podcast.duration || podcast.duration === 0) onDurationFetch(podcast.id, audio.duration);
          audio.playbackRate = playbackRate;
        }}
        onCanPlay={() => setIsLoading(false)}
        onWaiting={() => { if (isPlaying) setIsLoading(true); }}
        onPlaying={() => setIsLoading(false)}
        onError={handleAudioError}
        preload="auto"
      />

      {/* ...rest of your JSX stays exactly the same */}
    </>
  );
};

export default Player;
