import React, { useState, useRef, useEffect } from 'react';
import type { Podcast, Collection, LayoutMode, Theme } from '../types';
import { formatTime, formatBytes } from '../lib/utils';
import PlayIcon from './icons/PlayIcon';
import PauseIcon from './icons/PauseIcon';
import CheckIcon from './icons/CheckIcon';
import ThreeDotsIcon from './icons/ThreeDotsIcon';
import ChevronRightIcon from './icons/ChevronRightIcon';
import PlayCircleIcon from './icons/PlayCircleIcon';
import { useTranslation } from '../contexts/LanguageContext';

interface PodcastItemProps {
  podcast: Podcast;
  isActive: boolean;
  isPlaying: boolean;
  onSelect: (id: string) => void;
  onDeleteRequest: (id: string) => void;
  onToggleComplete: (id: string) => void;
  onMoveRequest: (podcastId: string, newCollectionId: string | null) => void;
  collections: Collection[];
  onAnimationEnd: () => void;
  isDeleting: boolean;
  style: React.CSSProperties;
  progressOverride?: number;
  useCollectionsView: boolean;
  playerLayout: LayoutMode;
  collectionArtworkUrl?: string | null;
  theme: Theme;
}

const PodcastItem: React.FC<PodcastItemProps> = ({ 
  podcast, 
  isActive, 
  isPlaying, 
  onSelect, 
  onDeleteRequest, 
  onToggleComplete,
  onMoveRequest,
  collections,
  onAnimationEnd,
  isDeleting,
  style,
  progressOverride,
  useCollectionsView,
  playerLayout,
  collectionArtworkUrl,
  theme
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMoveMenuOpen, setIsMoveMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();
  
  const isCompleted = podcast.isListened;
  const progressToShow = progressOverride !== undefined ? progressOverride : podcast.progress;
  const progressPercent = isCompleted ? 100 : podcast.duration > 0 ? (progressToShow / podcast.duration) * 100 : 0;
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
        setIsMoveMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  const handleMenuToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMenuOpen(prev => !prev);
    setIsMoveMenuOpen(false);
  }
  
  const handleAction = (e: React.MouseEvent, action: () => void) => {
    e.stopPropagation();
    action();
    setIsMenuOpen(false);
    setIsMoveMenuOpen(false);
  }

  if (playerLayout === 'pimsleur' && useCollectionsView) {
    const lessonName = podcast.name.replace(/preloaded audio/i, t('podcast.lesson')).toUpperCase();
    const isInProgress = progressToShow > 0 && !isCompleted;
    const defaultArtwork = theme === 'minecraft'
      ? 'https://i.imgur.com/e3l9k04.png' // dirt block
      : 'https://i.imgur.com/Q3QfWqV.png'; // old default

    return (
      <div
        onAnimationEnd={onAnimationEnd}
        style={style}
        className={`p-1 bg-brand-surface rounded-lg transition-all duration-300 b-border b-shadow
          ${isDeleting ? 'animate-shrink-out' : 'animate-slide-up-fade-in'}
          ${isActive ? 'ring-2 ring-brand-primary ring-offset-2 ring-offset-brand-bg' : ''}`
        }
      >
        <div
          className="relative aspect-square w-full cursor-pointer group"
          onClick={() => onSelect(podcast.id)}
        >
          <img
            src={collectionArtworkUrl || defaultArtwork}
            alt={`Artwork for ${podcast.name}`}
            className="w-full h-full object-cover rounded-md"
          />
          <div className="absolute inset-0 bg-black/20 rounded-md" />

          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <div
              className="w-12 h-12 bg-brand-primary/90 rounded-full flex items-center justify-center text-brand-text-on-primary hover:bg-brand-primary transition-transform transform hover:scale-110 active:scale-95 b-border"
              aria-label={`Play ${podcast.name}`}
            >
              <PlayIcon size={32} />
            </div>
          </div>
          
          <div className="absolute inset-0 flex items-center justify-center group-hover:opacity-0 transition-opacity">
             <div className="w-12 h-12 bg-brand-primary/50 rounded-full flex items-center justify-center text-brand-text-on-primary b-border">
                {isCompleted ? <CheckIcon size={24} /> : isInProgress ? <PlayCircleIcon size={32}/> : <span className="text-xl font-bold text-shadow-md">{lessonName}</span>}
             </div>
          </div>

          <div className="absolute bottom-1 left-1 right-1 h-1.5 bg-black/30 rounded-full overflow-hidden">
            <div className="bg-brand-primary h-full transition-all duration-200" style={{ width: `${progressPercent}%` }}/>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div
      onAnimationEnd={onAnimationEnd}
      style={style}
      className={`relative transition-colors duration-200 ${isDeleting ? 'animate-shrink-out' : 'animate-slide-up-fade-in'} ${isMenuOpen ? 'z-10' : ''}`}
    >
        <div className="absolute top-0 left-0 h-full bg-brand-surface-light rounded-lg" style={{ width: `${progressPercent}%` }}/>
        <div className={`absolute top-0 left-0 h-full bg-brand-primary/20 rounded-lg transition-opacity duration-300 ${isActive ? 'opacity-100' : 'opacity-0'}`} style={{ width: '100%' }} />
      
        <div className={`relative flex items-center gap-4 p-3 cursor-pointer`} onClick={() => onSelect(podcast.id)}>
            <div className="flex-shrink-0">
                <button className={`w-12 h-12 flex items-center justify-center rounded-full transition-all duration-200 b-border ${isActive ? 'bg-brand-primary text-brand-text-on-primary b-shadow' : 'bg-brand-surface text-brand-text'}`} aria-label={isPlaying && isActive ? `Pause ${podcast.name}` : `Play ${podcast.name}`}>
                    {isPlaying && isActive ? <PauseIcon size={24} /> : <PlayIcon size={24} />}
                </button>
            </div>
            
            <div className="flex-grow min-w-0">
                <p className={`font-semibold truncate ${isActive ? 'text-brand-primary' : 'text-brand-text'}`}>{podcast.name}</p>
                <div className="flex items-center gap-2 text-sm text-brand-text-secondary mt-1">
                    {isCompleted ? <><CheckIcon size={16} className="text-brand-primary" /><span>{t('podcast.completed')}</span></> : <span>{formatTime(progressToShow)} / {formatTime(podcast.duration || 0)}</span>}
                    {podcast.size ? <span>· {formatBytes(podcast.size)}</span> : null}
                </div>
            </div>

            <div className="flex-shrink-0 relative" ref={menuRef}>
                 <button onClick={handleMenuToggle} className="p-2 rounded-full text-brand-text-secondary hover:text-brand-text hover:bg-brand-surface-light transition-colors" aria-label={`Actions for ${podcast.name}`}>
                    <ThreeDotsIcon size={20} />
                </button>
                {isMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-56 bg-brand-surface-light rounded-md shadow-lg z-10 b-border animate-scale-in origin-top-right">
                        <ul className="py-1">
                            <li><button onClick={(e) => handleAction(e, () => onToggleComplete(podcast.id))} className="w-full text-left px-4 py-2 text-sm text-brand-text hover:bg-brand-surface flex items-center gap-3"><CheckIcon size={16}/> {isCompleted ? t('podcast.unmarkCompleted') : t('podcast.markCompleted')}</button></li>
                            <li className="relative">
                                <button onClick={(e) => { e.stopPropagation(); setIsMoveMenuOpen(p => !p); }} className="w-full text-left px-4 py-2 text-sm text-brand-text hover:bg-brand-surface flex items-center justify-between gap-3">
                                    <span>{t('podcast.moveTo')}</span>
                                    <ChevronRightIcon size={16} />
                                </button>
                                {isMoveMenuOpen && (
                                    <div className="absolute right-full top-0 mr-1 w-56 bg-brand-surface-light rounded-md shadow-lg z-20 b-border animate-scale-in origin-right">
                                        <ul className="py-1 max-h-48 overflow-y-auto">
                                            <li><button onClick={(e) => handleAction(e, () => onMoveRequest(podcast.id, null))} className="w-full text-left px-4 py-2 text-sm text-brand-text hover:bg-brand-surface">{t('podcast.uncategorized')}</button></li>
                                            {collections.map(c => (
                                                <li key={c.id}><button onClick={(e) => handleAction(e, () => onMoveRequest(podcast.id, c.id))} className="w-full text-left px-4 py-2 text-sm text-brand-text hover:bg-brand-surface">{c.name}</button></li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </li>
                            <div className="my-1 border-t border-brand-surface"></div>
                            <li><button onClick={(e) => handleAction(e, () => onDeleteRequest(podcast.id))} className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-500/10 flex items-center gap-3">{t('podcast.delete')}</button></li>
                        </ul>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};

export default PodcastItem;