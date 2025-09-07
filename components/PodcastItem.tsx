

import React, { useState, useRef, useEffect } from 'react';
import type { Podcast, Collection, LayoutMode, Theme } from '../types';
import { formatTime, formatBytes } from '../lib/utils';
import PlayIcon from './icons/PlayIcon';
import PauseIcon from './icons/PauseIcon';
import CheckIcon from './icons/CheckIcon';
import ThreeDotsIcon from './icons/ThreeDotsIcon';
import ChevronRightIcon from './icons/ChevronRightIcon';
import BookOpenIcon from './icons/BookOpenIcon';
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
  
  // Close menu when clicking outside
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
                <PlayIcon size={32} />
            </div>
          </div>
          
          <button className="absolute top-2 right-2 flex items-center gap-1.5 bg-brand-primary text-brand-text-on-primary text-xs font-bold px-3 py-1.5 rounded-full hover:bg-brand-primary-hover transition b-border">
             <BookOpenIcon size={14} />
             <span>&raquo;</span>
          </button>
        </div>
        
        <div className="p-3 bg-brand-surface text-brand-text rounded-b-lg">
          <div className="flex justify-between items-start">
            <div className="flex-grow min-w-0">
                <h3 className="font-bold text-sm truncate" title={lessonName}>{lessonName}</h3>
                {isInProgress && (
                  <span className="text-xs text-brand-text-secondary bg-brand-surface-light border border-brand-border-color mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full">
                    <PlayIcon size={10} /> {t('podcast.inProgress')}
                  </span>
                )}
            </div>
            
            <div className="relative flex-shrink-0 -mr-1 -mt-1" ref={menuRef}>
              <button onClick={handleMenuToggle} className="p-2 rounded-full hover:bg-brand-surface-light text-brand-text-secondary hover:text-brand-text">
                <ThreeDotsIcon size={20} />
              </button>
              {isMenuOpen && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-brand-surface-light rounded-md shadow-lg z-50 b-border animate-scale-in origin-top-right">
                  <ul className="py-1">
                      <li>
                          <button onClick={(e) => handleAction(e, () => onToggleComplete(podcast.id))} className="w-full text-left px-4 py-2 text-sm text-brand-text hover:bg-brand-surface">
                            {isCompleted ? t('podcast.unmarkCompleted') : t('podcast.markCompleted')}
                          </button>
                      </li>
                      <li className="relative">
                        <button onClick={(e) => { e.stopPropagation(); setIsMoveMenuOpen(prev => !prev); }} className="w-full text-left px-4 py-2 text-sm text-brand-text hover:bg-brand-surface flex justify-between items-center">
                          {t('podcast.moveTo')} <ChevronRightIcon size={16} className={`${isMoveMenuOpen ? 'rotate-90' : ''} transition-transform`}/>
                        </button>
                        {isMoveMenuOpen && (
                            <div className="absolute right-full top-0 mr-1 w-48 bg-brand-surface-light rounded-md shadow-lg b-border">
                                <ul className="py-1 max-h-48 overflow-y-auto">
                                    <li><button onClick={(e) => handleAction(e, () => onMoveRequest(podcast.id, null))} className="w-full text-left px-4 py-2 text-sm text-brand-text hover:bg-brand-surface disabled:opacity-50" disabled={podcast.collectionId === null}>{t('podcast.uncategorized')}</button></li>
                                    {collections.map(c => (<li key={c.id}><button onClick={(e) => handleAction(e, () => onMoveRequest(podcast.id, c.id))} className="w-full text-left px-4 py-2 text-sm text-brand-text hover:bg-brand-surface disabled:opacity-50" disabled={podcast.collectionId === c.id}>{c.name}</button></li>))}
                                </ul>
                            </div>
                        )}
                      </li>
                      <li><button onClick={(e) => handleAction(e, () => onDeleteRequest(podcast.id))} className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-500/10">{t('podcast.delete')}</button></li>
                  </ul>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex justify-around items-center mt-3 opacity-30">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="w-6 h-6 bg-brand-surface-light rounded-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={() => onSelect(podcast.id)}
      onAnimationEnd={onAnimationEnd}
      style={style}
      className={`p-4 flex items-center gap-4 border-b border-brand-surface cursor-pointer transition-all duration-200 relative transform origin-center
        ${isActive ? 'bg-brand-surface-light' : 'hover:bg-brand-surface hover:-translate-y-0.5'}
        ${isCompleted && !isActive ? 'opacity-60' : ''}
        ${isDeleting ? 'animate-shrink-out' : 'animate-slide-up-fade-in'}
        ${isMenuOpen ? 'z-50' : ''}
      `}
    >
      <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center">
        {isCompleted && !isActive ? (
          <div className="animate-scale-in">
            <CheckIcon size={24} color="text-brand-primary" />
          </div>
        ) : isActive ? (
          isPlaying ? <PauseIcon size={24} color="text-brand-primary" /> : <PlayIcon size={24} color="text-brand-primary" />
        ) : (
           <PlayIcon size={24} color="text-brand-text-secondary" />
        )}
      </div>
      <div className="flex-grow min-w-0">
        <h3 className={`font-semibold truncate ${isActive ? 'text-brand-primary' : 'text-brand-text'}`}>{podcast.name}</h3>
        <div className="mt-2 w-full bg-brand-surface rounded-full h-1.5">
          <div
            className="bg-brand-primary h-1.5 rounded-full"
            style={{ width: `${progressPercent}%`, transition: isActive ? 'width 0.2s linear' : 'none' }}
          ></div>
        </div>
      </div>
      <div className="flex-shrink-0 text-sm text-brand-text-secondary w-20 text-right">
        <span>{formatTime(podcast.duration)}</span>
        {typeof podcast.size === 'number' && podcast.storage === 'indexeddb' && (
           <span className="block text-xs opacity-80">{formatBytes(podcast.size)}</span>
        )}
      </div>
       <div className="flex-shrink-0 relative" ref={menuRef}>
          <button onClick={handleMenuToggle} className="p-2 rounded-full hover:bg-brand-surface-light text-brand-text-secondary hover:text-brand-text">
            <ThreeDotsIcon size={20} />
          </button>
          {isMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-brand-surface-light rounded-md shadow-lg z-50 b-border animate-scale-in origin-top-right">
                  <ul className="py-1">
                      <li>
                          <button 
                            onClick={(e) => handleAction(e, () => onToggleComplete(podcast.id))}
                            className="w-full text-left px-4 py-2 text-sm text-brand-text hover:bg-brand-surface"
                          >
                            {isCompleted ? t('podcast.unmarkCompleted') : t('podcast.markCompleted')}
                          </button>
                      </li>
                      {useCollectionsView && (
                        <li className="relative">
                          <button 
                            onClick={(e) => { e.stopPropagation(); setIsMoveMenuOpen(prev => !prev); }}
                            className="w-full text-left px-4 py-2 text-sm text-brand-text hover:bg-brand-surface flex justify-between items-center"
                          >
                            {t('podcast.moveTo')} <ChevronRightIcon size={16} className={`${isMoveMenuOpen ? 'rotate-180' : ''} transition-transform`}/>
                          </button>
                          {isMoveMenuOpen && (
                              <div className="absolute right-full top-0 mr-1 w-48 bg-brand-surface-light rounded-md shadow-lg b-border">
                                  <ul className="py-1 max-h-48 overflow-y-auto">
                                      <li>
                                        <button 
                                          onClick={(e) => handleAction(e, () => onMoveRequest(podcast.id, null))} 
                                          className="w-full text-left px-4 py-2 text-sm text-brand-text hover:bg-brand-surface disabled:opacity-50"
                                          disabled={podcast.collectionId === null}
                                        >
                                          {t('podcast.uncategorized')}
                                        </button>
                                      </li>
                                      {collections.map(c => (
                                          <li key={c.id}>
                                              <button
                                                  onClick={(e) => handleAction(e, () => onMoveRequest(podcast.id, c.id))}
                                                  className="w-full text-left px-4 py-2 text-sm text-brand-text hover:bg-brand-surface disabled:opacity-50"
                                                  disabled={podcast.collectionId === c.id}
                                              >
                                                  {c.name}
                                              </button>
                                          </li>
                                      ))}
                                  </ul>
                              </div>
                          )}
                        </li>
                      )}
                      <li>
                           <button 
                            onClick={(e) => handleAction(e, () => onDeleteRequest(podcast.id))}
                            className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-brand-surface"
                          >
                            {t('podcast.delete')}
                          </button>
                      </li>
                  </ul>
              </div>
          )}
      </div>
    </div>
  );
};

export default PodcastItem;