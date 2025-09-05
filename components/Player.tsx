import React, { useRef, useEffect, useState, useCallback } from 'react';
import type { Podcast, LayoutMode } from '../types';
import { formatTime } from '../lib/utils';
import * as db from '../lib/db';
import PlayIcon from './icons/PlayIcon';
import PauseIcon from './icons/PauseIcon';
import ChevronDownIcon from './icons/ChevronDownIcon';
import RedoIcon from './icons/RedoIcon';

interface PlayerProps {
  podcast: Podcast;
  isPlaying: boolean;
  setIsPlaying: (update: React.SetStateAction<boolean>) => void;
  onProgressSave: (id: string, progress: number) => void;
  onEnded: () => void;
  isPlayerExpanded: boolean;
  setIsPlayerExpanded: (isExpanded: boolean) => void;
  artworkUrl?: string | null;
  playbackRate: number;
  onPlaybackRateChange: (rate: number) => void;
  currentTime: number;
  onCurrentTimeUpdate: (time: number) => void;
  userId: string;
  onDurationFetch: (id: string, duration: number) => void;
  layoutMode: LayoutMode;
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
}) => {
  const togglePlayPause = useCallback(() => {
  if (!audioRef.current) return;
  if (isPlaying) {
    audioRef.current.pause();
  } else {
    audioRef.current.play().catch(e => console.error("Playback error:", e));
  }
  setIsPlaying(p => !p);
}, [isPlaying, setIsPlaying]);
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressUpdateDebounceRef = useRef<number | undefined>(undefined);
  const [dragState, setDragState] = useState({ isDragging: false, startY: 0, deltaY: 0 });
  const [audioSrc, setAudioSrc] = useState<string | undefined>(undefined);
  const [isLoadingSrc, setIsLoadingSrc] = useState(false);

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
  
  useEffect(() => {
    if (!isLoadingSrc && audioRef.current) {
        audioRef.current.currentTime = podcast.progress;
    }
  }, [isLoadingSrc, podcast.progress]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || isLoadingSrc) return;
    if (isPlaying && audio.paused) {
      audio.play().catch(e => console.error("Playback error:", e));
    } else if (!isPlaying && !audio.paused) {
      audio.pause();
    }
  }, [isPlaying, isLoadingSrc]);

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isPlayerExpanded) return;
    setDragState({ isDragging: true, startY: e.touches[0].clientY, deltaY: 0 });
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!dragState.isDragging || !isPlayerExpanded) return;
    const currentY = e.touches[0].clientY;
    const delta = Math.max(0, currentY - dragState.startY);
    setDragState(prev => ({ ...prev, deltaY: delta }));
  };

  const handleTouchEnd = () => {
    if (!dragState.isDragging || !isPlayerExpanded) return;
    if (dragState.deltaY > window.innerHeight / 4) {
      setIsPlayerExpanded(false);
    }
    setDragState({ isDragging: false, startY: 0, deltaY: 0 });
  };
  
  const progressPercent = podcast.duration > 0 ? (currentTime / podcast.duration) * 100 : 0;
  
  const expandedPlayerStyle: React.CSSProperties = dragState.isDragging
    ? { transition: 'none', transform: `translateY(${dragState.deltaY}px)` }
    : {};
    
  const animatedBackgroundStyle: React.CSSProperties = {
    background: `linear-gradient(${progressPercent * 3.6}deg, var(--brand-gradient-start), var(--brand-gradient-end))`,
    transition: 'background 1s linear',
  };

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    const newTime = audioRef.current.currentTime;
    onCurrentTimeUpdate(newTime);
    
    if (progressUpdateDebounceRef.current) {
      clearTimeout(progressUpdateDebounceRef.current);
    }
    progressUpdateDebounceRef.current = window.setTimeout(() => {
       onProgressSave(podcast.id, audioRef.current?.currentTime || 0);
    }, 1000); // Increased debounce to reduce Firestore writes
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const newTime = ((e.clientX - rect.left) / rect.width) * podcast.duration;
    audioRef.current.currentTime = newTime;
    onCurrentTimeUpdate(newTime);
    onProgressSave(podcast.id, newTime);
  };
  
  const handleSkip = useCallback((seconds: number) => {
    if (!audioRef.current) return;
    const newTime = Math.max(0, Math.min(podcast.duration, audioRef.current.currentTime + seconds));
    audioRef.current.currentTime = newTime;
    onCurrentTimeUpdate(newTime);
  }, [podcast.duration, onCurrentTimeUpdate]);

  const handleCycleSpeed = () => {
    const currentIndex = PLAYBACK_RATES.indexOf(playbackRate);
    onPlaybackRateChange(PLAYBACK_RATES[(currentIndex + 1) % PLAYBACK_RATES.length]);
  };
  
  const PimsleurCircularPlayer = () => {
    const size = 280;
    const strokeWidth = 12;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (progressPercent / 100) * circumference;

    return (
       <div className="flex-grow flex flex-col items-center justify-center text-center gap-8 w-full">
            <div className="relative" style={{ width: size, height: size }}>
                <svg width={size} height={size} className="transform -rotate-90">
                    <circle
                        cx={size/2}
                        cy={size/2}
                        r={radius}
                        stroke="var(--brand-surface)"
                        strokeWidth={strokeWidth}
                        fill="transparent"
                    />
                    <circle
                        cx={size/2}
                        cy={size/2}
                        r={radius}
                        stroke="var(--brand-primary)"
                        strokeWidth={strokeWidth}
                        fill="transparent"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        strokeLinecap="round"
                        className="transition-all duration-300 ease-linear"
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <h3 className="text-4xl font-bold text-brand-text mb-2">{formatTime(podcast.duration - currentTime)}</h3>
                    <button onClick={togglePlayPause} className={`bg-brand-primary text-brand-text-on-primary rounded-full p-5 b-border b-shadow hover:bg-brand-primary-hover transition-transform transform active:scale-95`}>
                        {isPlaying ? <PauseIcon size={32} /> : <PlayIcon size={32} />}
                    </button>
                </div>
            </div>
            
            <h2 className="text-2xl font-bold text-brand-text mt-4 px-4">{podcast.name}</h2>
            
            <div className={`flex items-center justify-center gap-2 w-full max-w-sm`}>
                <button onClick={() => handleSkip(-10)} className="text-brand-text-secondary hover:text-brand-text p-4 rounded-full text-sm transform transition-transform hover:scale-110 active:scale-95">
                  <RedoIcon size={24} className="backward -scale-x-100"/>
                </button>
                <button onClick={handleCycleSpeed} className="text-brand-text font-semibold p-3 rounded-md w-24 text-center bg-brand-surface hover:bg-brand-surface-light transition-colors b-border transform hover:scale-105 active:scale-95">
                    {playbackRate}x
                </button>
                <button onClick={() => handleSkip(10)} className="text-brand-text-secondary hover:text-brand-text p-4 rounded-full text-sm transform transition-transform hover:scale-110 active:scale-95">
                  <RedoIcon size={24} className="forward"/>
                </button>
            </div>
        </div>
    );
};
  
  const DefaultExpandedPlayer = () => {
     const sharedProgressBar = (
      <div className="w-full">
        <div className="w-full bg-brand-surface rounded-full h-1.5 cursor-pointer group b-border" onClick={handleSeek} data-no-sound="true">
          <div className="bg-brand-primary h-full rounded-full transition-all duration-200 ease-linear" style={{ width: `${progressPercent}%` }} />
        </div>
        <div className="flex justify-between text-xs text-brand-text-secondary mt-1">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(podcast.duration)}</span>
        </div>
      </div>
    );

     const sharedControls = (
      <div className={`flex items-center justify-center gap-2 w-full max-w-sm`}>
        <button onClick={handleCycleSpeed} className="text-brand-text font-semibold p-2 rounded-md w-16 text-center bg-brand-surface hover:bg-brand-surface-light transition-colors b-border transform hover:scale-105 active:scale-95">
            {playbackRate}x
        </button>
        <button onClick={() => handleSkip(-5)} className="text-brand-text-secondary hover:text-brand-text p-2 rounded-full text-sm transform transition-transform hover:scale-110 active:scale-95">-5s</button>
        <button onClick={togglePlayPause} className={`bg-brand-primary text-brand-text-on-primary rounded-full p-5 hover:bg-brand-primary-hover transition-transform transform active:scale-95 b-border b-shadow`}>
          {isPlaying ? <PauseIcon size={32} /> : <PlayIcon size={32} />}
        </button>
        <button onClick={() => handleSkip(5)} className="text-brand-text-secondary hover:text-brand-text p-2 rounded-full text-sm transform transition-transform hover:scale-110 active:scale-95">+5s</button>
        <div className="w-16" aria-hidden="true" />
      </div>
    );
    
    return (
      <div className="flex-grow flex flex-col items-center justify-center text-center gap-6 sm:gap-8">
        <div className={`w-56 h-56 sm:w-64 sm:h-64 md:w-80 md:h-80 bg-brand-surface rounded-lg shadow-2xl overflow-hidden b-border b-shadow transition-transform ${isPlaying ? 'animate-pulse-slow' : ''}`}>
          <img src={artworkUrl || "https://i.imgur.com/Q3QfWqV.png"} alt={`Artwork for ${podcast.name}`} className="w-full h-full object-cover" />
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-brand-text">{podcast.name}</h2>
        <div className="w-full max-w-md px-4 sm:px-0">{sharedProgressBar}</div>
         {sharedControls}
      </div>
    );
  };
  
  return (
    <>
      <audio 
        ref={audioRef} 
        src={audioSrc} 
        onTimeUpdate={handleTimeUpdate} 
        onEnded={onEnded} 
        onLoadedMetadata={() => {
            if (audioRef.current) {
                if (podcast.duration === 0) {
                    onDurationFetch(podcast.id, audioRef.current.duration);
                }
                audioRef.current.currentTime = podcast.progress;
                audioRef.current.playbackRate = playbackRate;
                onCurrentTimeUpdate(podcast.progress);
            }
        }}
        preload="metadata" 
      />
      <div className={`fixed left-0 right-0 z-20 transition-all duration-500 ease-in-out ${isPlayerExpanded ? 'bottom-0 top-0' : 'bottom-0'}`}>
        <div className={`absolute inset-0 flex flex-col p-4 sm:p-8 transition-transform duration-300 ease-in-out ${isPlayerExpanded ? 'translate-y-0' : 'translate-y-full pointer-events-none'}`} style={expandedPlayerStyle} onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd} onTouchCancel={handleTouchEnd}>
          <div className="absolute inset-0 -z-10 animated-player-bg" style={animatedBackgroundStyle} />
           {layoutMode === 'pimsleur' && artworkUrl && (
             <img src={artworkUrl} alt="" className="absolute inset-0 w-full h-full object-cover -z-20 opacity-20" />
           )}
          <div className="flex-shrink-0">
            <button onClick={() => setIsPlayerExpanded(false)} className="text-brand-text-secondary hover:text-brand-text"><ChevronDownIcon size={32} /></button>
          </div>
          {layoutMode === 'pimsleur' ? <PimsleurCircularPlayer /> : <DefaultExpandedPlayer />}
        </div>
        <div className={`absolute bottom-0 left-0 right-0 bg-brand-surface-light shadow-2xl transition-transform duration-500 ease-in-out cursor-pointer b-border ${isPlayerExpanded ? 'translate-y-full' : 'translate-y-0'}`} onClick={() => setIsPlayerExpanded(true)} role="button" aria-label="Expand player">
          <div className="absolute top-0 left-0 w-full h-1 bg-brand-surface">
            <div className="bg-brand-primary h-full" style={{ width: `${progressPercent}%`, transition: 'width 0.2s linear' }} />
          </div>
          <div className="max-w-4xl mx-auto flex items-center gap-3 p-2 sm:p-3">
            <div className="w-12 h-12 flex-shrink-0 bg-brand-surface rounded-md overflow-hidden b-border">
              <img src={artworkUrl || "https://i.imgur.com/Q3QfWqV.png"} alt={`Artwork for ${podcast.name}`} className="w-full h-full object-cover" />
            </div>
            <div className="flex-grow min-w-0">
              <p className="font-bold text-brand-text truncate">{podcast.name}</p>
              <p className="text-xs text-brand-text-secondary">{formatTime(currentTime)} / {formatTime(podcast.duration)}</p>
            </div>
            <div className="flex-shrink-0 flex items-center gap-1 sm:gap-2">
              <button onClick={(e) => { e.stopPropagation(); handleSkip(-10); }} className="text-brand-text-secondary hover:text-brand-text p-2 rounded-full b-border transform transition-transform active:scale-90" aria-label="Skip backward 10 seconds">
                <RedoIcon size={20} className="backward -scale-x-100" />
              </button>
              <button onClick={(e) => { e.stopPropagation(); togglePlayPause(); }} className="text-brand-text p-3 rounded-full hover:bg-brand-surface b-border transform transition-transform active:scale-90" aria-label={isPlaying ? "Pause" : "Play"}>
                {isPlaying ? <PauseIcon size={24} /> : <PlayIcon size={24} />}
              </button>
              <button onClick={(e) => { e.stopPropagation(); handleSkip(10); }} className="text-brand-text-secondary hover:text-brand-text p-2 rounded-full b-border transform transition-transform active:scale-90" aria-label="Skip forward 10 seconds">
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