import React, { useState, useRef, useEffect } from 'react';
import type { Podcast, Collection, LayoutMode } from '../types';
import { formatTime, formatBytes } from '../lib/utils';
import PlayIcon from './icons/PlayIcon';
import PauseIcon from './icons/PauseIcon';
import CheckIcon from './icons/CheckIcon';
import ThreeDotsIcon from './icons/ThreeDotsIcon';
import ChevronRightIcon from './icons/ChevronRightIcon';

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
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMoveMenuOpen, setIsMoveMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  
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

  const commonItemContainerProps = {
    onClick: () => onSelect(podcast.id),
    onAnimationEnd: onAnimationEnd,
    style: style,
    className: `p-4 flex items-center gap-4 border-b border-brand-surface cursor-pointer transition-all duration-200 relative transform origin-center
      ${isActive ? 'bg-brand-surface-light' : 'hover:bg-brand-surface hover:-translate-y-0.5'}
      ${isCompleted && !isActive ? 'opacity-60' : ''}
      ${isDeleting ? 'animate-shrink-out' : 'animate-slide-up-fade-in'}
      ${isMenuOpen ? 'z-10' : ''}
    `,
  };

  if (playerLayout === 'pimsleur') {
    const size = 40;
    const strokeWidth = 3;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (progressPercent / 100) * circumference;

    return (
      <div {...commonItemContainerProps}>
        <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center relative">
          <svg width={size} height={size} className="transform -rotate-90">
            <circle cx={size / 2} cy={size / 2} r={radius} stroke="var(--brand-surface)" strokeWidth={strokeWidth} fill="transparent" />
            {progressPercent > 0 && !isCompleted && (
              <circle cx={size / 2} cy={size / 2} r={radius} stroke="var(--brand-primary)" strokeWidth={strokeWidth} fill="transparent" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" className="transition-all duration-300 ease-linear" />
            )}
            {isCompleted && (
              <circle cx={size / 2} cy={size / 2} r={radius} stroke="var(--brand-primary)" strokeWidth={strokeWidth} fill="transparent" />
            )}
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            {isCompleted ? <CheckIcon size={20} color="text-brand-primary" />
              : isActive ? (isPlaying ? <PauseIcon size={20} color="text-brand-primary" /> : <PlayIcon size={20} color="text-brand-primary" />)
              : <PlayIcon size={20} color="text-brand-text-secondary" />}
          </div>
        </div>
        <div className="flex-grow min-w-0">
          <h3 className={`font-semibold truncate ${isActive ? 'text-brand-primary' : 'text-brand-text'}`}>{podcast.name}</h3>
          <p className="text-sm text-brand-text-secondary">
            {isCompleted ? 'Completed' : `${formatTime((podcast.duration || 0) - progressToShow)} remaining`}
          </p>
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
                {/* Menu content remains the same */}
                <ul className="py-1">
                      <li>
                          <button 
                            onClick={(e) => handleAction(e, () => onToggleComplete(podcast.id))}
                            className="w-full text-left px-4 py-2 text-sm text-brand-text hover:bg-brand-surface"
                          >
                            {isCompleted ? 'Unmark as completed' : 'Mark as completed'}
                          </button>
                      </li>
                      {useCollectionsView && (
                        <li className="relative">
                          <button 
                            onClick={(e) => { e.stopPropagation(); setIsMoveMenuOpen(prev => !prev); }}
                            className="w-full text-left px-4 py-2 text-sm text-brand-text hover:bg-brand-surface flex justify-between items-center"
                          >
                            Move to... <ChevronRightIcon size={16} className={`${isMoveMenuOpen ? 'rotate-180' : ''} transition-transform`}/>
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
                                          Uncategorized
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
                            Delete
                          </button>
                      </li>
                  </ul>
              </div>
            )}
        </div>
      </div>
    );
  }

  return (
    <div {...commonItemContainerProps}>
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
                            {isCompleted ? 'Unmark as completed' : 'Mark as completed'}
                          </button>
                      </li>
                      {useCollectionsView && (
                        <li className="relative">
                          <button 
                            onClick={(e) => { e.stopPropagation(); setIsMoveMenuOpen(prev => !prev); }}
                            className="w-full text-left px-4 py-2 text-sm text-brand-text hover:bg-brand-surface flex justify-between items-center"
                          >
                            Move to... <ChevronRightIcon size={16} className={`${isMoveMenuOpen ? 'rotate-180' : ''} transition-transform`}/>
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
                                          Uncategorized
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
                            Delete
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