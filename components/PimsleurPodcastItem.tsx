import React, { useState, useRef, useEffect, useMemo } from 'react';
import type { Podcast, Collection } from '../types';
import PlayIcon from './icons/PlayIcon';
import CheckIcon from './icons/CheckIcon';
import ThreeDotsIcon from './icons/ThreeDotsIcon';
import ChevronRightIcon from './icons/ChevronRightIcon';

interface PimsleurPodcastItemProps {
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
  useCollectionsView: boolean;
  customArtwork: string | null;
}

const PimsleurPodcastItem: React.FC<PimsleurPodcastItemProps> = (props) => {
  const { 
    podcast, isActive, isPlaying, onSelect, onDeleteRequest, 
    onToggleComplete, onMoveRequest, collections, onAnimationEnd,
    isDeleting, style, useCollectionsView, customArtwork 
  } = props;
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMoveMenuOpen, setIsMoveMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isCompleted = podcast.isListened;
  const isInProgress = podcast.progress > 0 && !isCompleted;
  const progressPercent = isCompleted ? 100 : podcast.duration > 0 ? (podcast.progress / podcast.duration) * 100 : 0;
  
  const artworkToShow = useMemo(() => {
    const collection = collections.find(c => c.id === podcast.collectionId);
    if (collection?.artworkUrl) {
      return collection.artworkUrl;
    }
    return customArtwork;
  }, [podcast.collectionId, collections, customArtwork]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
        setIsMoveMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  const handleMenuToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMenuOpen(prev => !prev);
    setIsMoveMenuOpen(false);
  };
  
  const handleAction = (e: React.MouseEvent, action: () => void) => {
    e.stopPropagation();
    action();
    setIsMenuOpen(false);
    setIsMoveMenuOpen(false);
  };

  return (
    <div
      onClick={() => onSelect(podcast.id)}
      onAnimationEnd={onAnimationEnd}
      style={style}
      className={`group relative aspect-square rounded-lg b-border b-shadow overflow-hidden cursor-pointer transition-all duration-300 transform hover:-translate-y-1 hover:shadow-2xl
        ${isDeleting ? 'animate-shrink-out' : 'animate-slide-up-fade-in'}
        ${isActive ? 'ring-2 ring-brand-primary ring-offset-2 ring-offset-brand-bg' : ''}
      `}
      aria-label={`${podcast.name}, status: ${isCompleted ? 'Completed' : isInProgress ? 'In Progress' : 'Not Started'}`}
    >
      <img 
        src={artworkToShow || "https://i.imgur.com/Q3QfWqV.png"} 
        alt="" 
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
      
      <div className="absolute inset-0 flex items-center justify-center">
        {isCompleted ? (
          <div className="w-16 h-16 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center animate-scale-in">
            <CheckIcon size={40} color="text-brand-primary" />
          </div>
        ) : (
          <div className="w-16 h-16 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform group-hover:scale-100 scale-90">
             <PlayIcon size={40} color="text-white" />
          </div>
        )}
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
        <h3 className="font-bold truncate" title={podcast.name}>{podcast.name}</h3>
        <div className="flex items-center justify-between text-xs mt-1 text-white/80">
          <span>{isCompleted ? 'Completed' : 'In Progress'}</span>
          {/* Fix: Changed `className` prop to `color` to match the `CheckIcon` component's props. */}
          <CheckIcon size={14} color={isCompleted ? 'text-brand-primary' : 'text-transparent'}/>
        </div>
        <div className="w-full bg-white/20 rounded-full h-1 mt-2 overflow-hidden">
          <div className="bg-brand-primary h-full" style={{ width: `${progressPercent}%` }} />
        </div>
      </div>
      
       <div className="absolute top-2 right-2 z-20" ref={menuRef}>
          <button onClick={handleMenuToggle} className="p-2 rounded-full bg-black/40 hover:bg-black/60 text-white md:opacity-0 group-hover:opacity-100 transition-opacity">
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

export default PimsleurPodcastItem;