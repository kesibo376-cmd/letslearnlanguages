import React, { useState, useCallback, useEffect, useMemo } from 'react';
import type { Podcast, LayoutMode } from '../types';
import { formatTime } from '../lib/utils';
import PlayIcon from './icons/PlayIcon';
import PauseIcon from './icons/PauseIcon';
import ChevronDownIcon from './icons/ChevronDownIcon';
import RedoIcon from './icons/RedoIcon';
import SettingsIcon from './icons/SettingsIcon';
import ToggleSwitch from './ToggleSwitch';

interface PlayerProps {
  podcast: Podcast;
  isPlaying: boolean;
  isPlayerExpanded: boolean;
  setIsPlayerExpanded: (update: React.SetStateAction<boolean>) => void;
  artworkUrl?: string | null;
  playbackRate: number;
  onPlaybackRateChange: (rate: number) => void;
  currentTime: number;
  layoutMode: LayoutMode;
  setPlayerLayout: (layout: LayoutMode) => void;
  showPlaybackSpeedControl: boolean;
  setShowPlaybackSpeedControl: (value: boolean) => void;
  isLoading: boolean;
  onTogglePlayPause: () => void;
  onSkip: (seconds: number) => void;
  onSeek: (newTime: number) => void;
}

const PLAYBACK_RATES = [0.75, 1, 1.25, 1.5, 2];

const Player: React.FC<PlayerProps> = ({
  podcast,
  isPlaying,
  isPlayerExpanded,
  setIsPlayerExpanded,
  artworkUrl,
  playbackRate,
  onPlaybackRateChange,
  currentTime,
  layoutMode,
  setPlayerLayout,
  showPlaybackSpeedControl,
  setShowPlaybackSpeedControl,
  isLoading,
  onTogglePlayPause,
  onSkip,
  onSeek,
}) => {
  const [isSettingsMenuOpen, setIsSettingsMenuOpen] = useState(false);
  const [skipIndicator, setSkipIndicator] = useState<'forward' | 'backward' | null>(null);
  const [indicatorKey, setIndicatorKey] = useState(0);

  const handleTogglePlayPauseClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onTogglePlayPause();
  }, [onTogglePlayPause]);

  useEffect(() => {
    if (skipIndicator) {
      const timer = setTimeout(() => setSkipIndicator(null), 500);
      return () => clearTimeout(timer);
    }
  }, [skipIndicator]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.isContentEditable) return;
      if (event.key.toLowerCase() === 'f') {
        event.preventDefault();
        setIsPlayerExpanded(prev => !prev);
      } else if (event.key === ' ' && isPlayerExpanded) {
        event.preventDefault();
        onTogglePlayPause();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isPlayerExpanded, setIsPlayerExpanded, onTogglePlayPause]);

  const handleSkipClick = useCallback((seconds: number, e?: React.MouseEvent | React.TouchEvent) => {
    e?.stopPropagation();
    onSkip(seconds);
  }, [onSkip]);

  const handleSeekInternal = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (!podcast.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const newTime = ((e.clientX - rect.left) / rect.width) * podcast.duration;
    onSeek(newTime);
  }, [podcast.duration, onSeek]);

  const handleCycleSpeed = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    const currentIndex = PLAYBACK_RATES.indexOf(playbackRate);
    const nextIndex = (currentIndex + 1) % PLAYBACK_RATES.length;
    onPlaybackRateChange(PLAYBACK_RATES[nextIndex]);
  }, [playbackRate, onPlaybackRateChange]);
  
  const handleArtworkTap = (direction: 'forward' | 'backward', e: React.MouseEvent) => {
    e.stopPropagation();
    const seconds = direction === 'forward' ? 10 : -10;
    onSkip(seconds);
    setSkipIndicator(direction);
    setIndicatorKey(prev => prev + 1); // Reset animation
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => { e.preventDefault(); };

  const progressPercent = podcast?.duration && podcast.duration > 0 ? (currentTime / podcast.duration) * 100 : 0;
  const animatedBackgroundStyle: React.CSSProperties = { background: `linear-gradient(${progressPercent * 3.6}deg, var(--brand-gradient-start), var(--brand-gradient-end))`, transition: 'background 1s linear' };

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
            <button onClick={handleTogglePlayPauseClick} className="bg-brand-primary text-brand-text-on-primary rounded-full p-5 z-10 b-border b-shadow hover:bg-brand-primary-hover transition-transform transform active:scale-95 sm:scale-100 scale-110 flex items-center justify-center">
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
          <button onClick={(e) => handleSkipClick(-10, e)} onTouchStart={e => e.stopPropagation()} className="text-brand-text-secondary hover:text-brand-text p-4 rounded-full text-sm transform transition-transform hover:scale-110 active:scale-95">
            <RedoIcon size={24} className="backward -scale-x-100" />
          </button>
          {showPlaybackSpeedControl && (
            <button onClick={handleCycleSpeed} onTouchStart={e => e.stopPropagation()} className="text-brand-text font-semibold p-3 rounded-md w-24 text-center bg-brand-surface hover:bg-brand-surface-light transition-colors b-border transform hover:scale-105 active:scale-95">
              {playbackRate}x
            </button>
          )}
          <button onClick={(e) => handleSkipClick(10, e)} onTouchStart={e => e.stopPropagation()} className="text-brand-text-secondary hover:text-brand-text p-4 rounded-full text-sm transform transition-transform hover:scale-110 active:scale-95">
            <RedoIcon size={24} className="forward" />
          </button>
        </div>
      </div>
    );
  };

  const DefaultExpandedPlayer = () => {
    return (
      <div className="flex-grow flex flex-col items-center justify-center text-center gap-4 sm:gap-6">
        <div className={`relative w-48 h-48 sm:w-64 sm:h-64 bg-brand-surface rounded-lg shadow-2xl overflow-hidden b-border b-shadow transition-transform ${isPlaying && !isLoading ? 'animate-pulse-slow' : ''}`}>
          <img src={artworkUrl || 'https://i.imgur.com/Q3QfWqV.png'} alt={`Artwork for ${podcast.name}`} className="w-full h-full object-cover" />
          
           {/* Tap-to-seek overlays */}
          <div className="absolute inset-0 flex" data-no-drag="true">
              <div className="w-1/3 h-full cursor-pointer" onClick={(e) => handleArtworkTap('backward', e)} role="button" aria-label="Skip backward 10 seconds" />
              <div className="w-1/3 h-full cursor-pointer" onClick={(e) => { e.stopPropagation(); onTogglePlayPause(); }} role="button" aria-label={isPlaying ? 'Pause' : 'Play'}/>
              <div className="w-1/3 h-full cursor-pointer" onClick={(e) => handleArtworkTap('forward', e)} role="button" aria-label="Skip forward 10 seconds" />
          </div>

          {/* Skip indicator animation */}
          <div className={`absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-none transition-opacity duration-300 ${skipIndicator ? 'opacity-100' : 'opacity-0'}`}>
              {skipIndicator === 'backward' && <RedoIcon key={indicatorKey} size={48} className="text-white -scale-x-100 animate-skip-indicator" />}
              {skipIndicator === 'forward' && <RedoIcon key={indicatorKey} size={48} className="text-white animate-skip-indicator" />}
          </div>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-brand-text">{podcast.name}</h2>
        <div className="w-full max-w-md px-4 sm:px-0" data-no-drag="true">
          <div className="w-full bg-brand-surface rounded-full h-1.5 cursor-pointer group b-border" onClick={handleSeekInternal} onTouchStart={(e) => e.stopPropagation()}>
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
          <button onClick={(e) => handleSkipClick(-10, e)} onTouchStart={e => e.stopPropagation()} className="text-brand-text-secondary hover:text-brand-text p-4 rounded-full text-sm transform transition-transform hover:scale-110 active:scale-95">
            <RedoIcon size={24} className="backward -scale-x-100" />
          </button>
          <button onClick={handleTogglePlayPauseClick} className="bg-brand-primary text-brand-text-on-primary rounded-full p-5 z-10 hover:bg-brand-primary-hover transition-transform transform active:scale-95 sm:scale-100 scale-110 b-border b-shadow flex items-center justify-center">
             {isLoading ? (
                <svg className="animate-spin h-8 w-8 text-brand-text-on-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : isPlaying ? <PauseIcon size={32} /> : <PlayIcon size={32} />}
          </button>
          <button onClick={(e) => handleSkipClick(10, e)} onTouchStart={e => e.stopPropagation()} className="text-brand-text-secondary hover:text-brand-text p-4 rounded-full text-sm transform transition-transform hover:scale-110 active:scale-95">
            <RedoIcon size={24} className="forward" />
          </button>
          {showPlaybackSpeedControl && (
            <div className="w-16" aria-hidden="true" />
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={`fixed left-0 right-0 z-20 transition-all duration-500 ease-in-out ${isPlayerExpanded ? 'bottom-0 top-0' : 'bottom-0'}`}>
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
                                <label className="font-semibold text-brand-text">Circular Player</label>
                                <ToggleSwitch isOn={layoutMode === 'pimsleur'} handleToggle={() => setPlayerLayout(layoutMode === 'pimsleur' ? 'default' : 'pimsleur')} />
                            </div>
                            <div className="flex items-center justify-between p-3 bg-brand-surface-light rounded-md b-border">
                                <label className="font-semibold text-brand-text">Show Speed Control</label>
                                <ToggleSwitch isOn={showPlaybackSpeedControl} handleToggle={() => setShowPlaybackSpeedControl(!showPlaybackSpeedControl)} />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {layoutMode === 'pimsleur' ? <PimsleurCircularPlayer /> : <DefaultExpandedPlayer />}
        </div>
        
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
                    <button onClick={(e) => handleSkipClick(-10, e)} onTouchStart={e => e.stopPropagation()} className="text-brand-text-secondary hover:text-brand-text p-2 rounded-full text-sm transform transition-transform hover:scale-110 active:scale-95">
                        <RedoIcon size={20} className="backward -scale-x-100" />
                    </button>
                    <button onClick={handleTogglePlayPauseClick} className="bg-brand-primary text-brand-text-on-primary rounded-full p-2 hover:bg-brand-primary-hover transition-transform transform active:scale-95 b-border b-shadow w-9 h-9 flex items-center justify-center">
                        {isLoading ? (
                        <svg className="animate-spin h-5 w-5 text-brand-text-on-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        ) : isPlaying ? <PauseIcon size={20} /> : <PlayIcon size={20} />}
                    </button>
                    <button onClick={(e) => handleSkipClick(10, e)} onTouchStart={e => e.stopPropagation()} className="text-brand-text-secondary hover:text-brand-text p-2 rounded-full text-sm transform transition-transform hover:scale-110 active:scale-95">
                        <RedoIcon size={20} className="forward" />
                    </button>
                </div>
            </div>
        </div>
    </div>
  );
};

export default Player;