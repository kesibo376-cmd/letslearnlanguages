
import React, { useState, useRef, useEffect } from 'react';
import type { Theme } from '../types';
import PlayIcon from './icons/PlayIcon';
import ThreeDotsIcon from './icons/ThreeDotsIcon';
import EditIcon from './icons/EditIcon';
import TrashIcon from './icons/TrashIcon';
import RedoIcon from './icons/RedoIcon';
import ImageIcon from './icons/ImageIcon';
import FolderIcon from './icons/FolderIcon';
import { useTranslation } from '../contexts/LanguageContext';

interface CollectionItemProps {
  collection: {
    id: string;
    name: string;
    artworkUrl?: string;
    podcastCount: number;
    completionPercentage: number;
  };
  onNavigate: () => void;
  onPlay: () => void;
  onRename: (newName: string) => void;
  onDelete: () => void;
  onResetProgress: () => void;
  onSetArtwork: (collectionId: string, url: string | null) => void;
  style: React.CSSProperties;
  theme: Theme;
}

const CollectionItem: React.FC<CollectionItemProps> = ({
  collection,
  onNavigate,
  onPlay,
  onRename,
  onDelete,
  onResetProgress,
  onSetArtwork,
  style,
  theme,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const isUncategorized = collection.id === 'uncategorized';
  const { t } = useTranslation();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMenuToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMenuOpen(prev => !prev);
  };

  const handleAction = (e: React.MouseEvent, action: () => void) => {
    e.stopPropagation();
    action();
    setIsMenuOpen(false);
  };
  
  const handleRename = () => {
    const newName = prompt(t('collection.renamePrompt', { name: collection.name }), collection.name);
    if (newName && newName.trim() && newName.trim() !== collection.name) {
      onRename(newName.trim());
    }
  };

  const handleDelete = () => {
    if (window.confirm(t('collection.deleteConfirm', { name: collection.name }))) {
      onDelete();
    }
  };

  const handleReset = () => {
    if (window.confirm(t('collection.resetConfirm', { name: collection.name }))) {
      onResetProgress();
    }
  };
  
  const handleSetArtwork = () => {
    const newUrl = prompt(t('collection.setArtworkPrompt', { name: collection.name }), collection.artworkUrl || '');
    // Allow setting an empty string to remove the artwork
    if (newUrl !== null) {
        onSetArtwork(collection.id, newUrl.trim() || null);
    }
  };

  const handleRemoveArtwork = () => {
    if (window.confirm(t('collection.removeArtworkConfirm', { name: collection.name }))) {
      onSetArtwork(collection.id, null);
    }
  };

  const hasArtwork = !!collection.artworkUrl;

  return (
    <div
      style={style}
      className={
        `group relative flex flex-col bg-brand-surface rounded-lg b-border b-shadow transition-all duration-300 animate-slide-up-fade-in collection-item b-shadow-hover overflow-visible ${
          isMenuOpen ? 'z-50' : 'z-0'
        }`
      }
    >
      <div 
        className="relative aspect-[4/3] w-full cursor-pointer"
        onClick={onNavigate}
      >
        {hasArtwork ? (
          <img
            src={collection.artworkUrl}
            alt={`Artwork for ${collection.name}`}
            className="absolute inset-0 w-full h-full object-cover transition-all duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-brand-surface-light text-brand-text-secondary">
              <FolderIcon size={64} className="collection-folder-fill"/>
          </div>
        )}
        
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300" />

        <div 
          className="absolute bottom-4 left-4 right-4 transition-all duration-300 ease-in-out transform translate-y-8 opacity-0 group-hover:translate-y-0 group-hover:opacity-100"
          aria-hidden="true"
        >
          <div 
            className="flex items-center justify-between w-full h-14 px-3 bg-white/10 backdrop-blur-md rounded-lg border border-white/20 shadow-lg"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-md overflow-hidden flex-shrink-0 bg-brand-surface">
                {hasArtwork ? (
                  <img src={collection.artworkUrl} alt="" className="w-full h-full object-cover"/>
                ) : (
                  <FolderIcon size={16} className="text-brand-text-secondary m-auto" />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-white text-sm font-bold truncate">{isUncategorized ? t('collection.uncategorized') : collection.name}</p>
                <p className="text-white/70 text-xs">{collection.podcastCount} {collection.podcastCount !== 1 ? t('collection.items') : t('collection.item')}</p>
              </div>
            </div>
            
            <button
              onClick={(e) => { e.stopPropagation(); onPlay(); }}
              className="flex-shrink-0 w-10 h-10 rounded-full bg-brand-primary text-brand-text-on-primary flex items-center justify-center transition-transform transform hover:scale-110 active:scale-95 b-border"
              aria-label={`Play collection ${collection.name}`}
            >
              <PlayIcon size={24} />
            </button>
          </div>
        </div>
      </div>
      
      <div className="p-4 flex-grow flex flex-col">
        <div className="flex justify-between items-start gap-2">
            <h3 
                className="font-bold text-brand-text truncate cursor-pointer flex-grow" 
                onClick={onNavigate}
                title={collection.name}
            >
                {isUncategorized ? t('collection.uncategorized') : collection.name}
            </h3>
            {!isUncategorized && (
                <div className="relative flex-shrink-0" ref={menuRef}>
                    <button onClick={handleMenuToggle} className="p-1 rounded-full text-brand-text-secondary hover:text-brand-text hover:bg-brand-surface-light" aria-label={`Actions for ${collection.name}`}>
                        <ThreeDotsIcon size={20} />
                    </button>
                    {isMenuOpen && (
                         <div className="absolute right-0 top-full mt-2 w-56 bg-brand-surface-light rounded-md shadow-lg z-20 b-border animate-scale-in origin-top-right">
                            <ul className="py-1">
                                <li><button onClick={(e) => handleAction(e, handleRename)} className="w-full text-left px-4 py-2 text-sm text-brand-text hover:bg-brand-surface flex items-center gap-3"><EditIcon size={16}/> {t('collection.rename')}</button></li>
                                <li><button onClick={(e) => handleAction(e, handleSetArtwork)} className="w-full text-left px-4 py-2 text-sm text-brand-text hover:bg-brand-surface flex items-center gap-3"><ImageIcon size={16}/> {t('collection.setArtwork')}</button></li>
                                {collection.artworkUrl && (
                                    <li><button onClick={(e) => handleAction(e, handleRemoveArtwork)} className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-500/10 flex items-center gap-3"><TrashIcon size={16}/> {t('collection.removeArtwork')}</button></li>
                                )}
                                <li><button onClick={(e) => handleAction(e, handleReset)} className="w-full text-left px-4 py-2 text-sm text-brand-text hover:bg-brand-surface flex items-center gap-3"><RedoIcon size={16}/> {t('collection.resetProgress')}</button></li>
                                <div className="my-1 border-t border-brand-surface"></div>
                                <li><button onClick={(e) => handleAction(e, handleDelete)} className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-500/10 flex items-center gap-3"><TrashIcon size={16}/> {t('collection.delete')}</button></li>
                            </ul>
                        </div>
                    )}
                </div>
            )}
        </div>
        <p className="text-sm text-brand-text-secondary mt-1">{collection.podcastCount} {collection.podcastCount !== 1 ? t('collection.items') : t('collection.item')}</p>
        
        <div className="mt-auto pt-2">
            <div className="flex justify-between items-center text-xs text-brand-text-secondary mb-1">
                <span className="font-semibold text-brand-text">{t('collection.complete', { percentage: Math.round(collection.completionPercentage) })}</span>
            </div>
            <div
                className="w-full bg-brand-surface-light rounded-full h-2 b-border"
                role="progressbar"
                aria-valuenow={collection.completionPercentage}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${collection.name} progress`}
            >
                <div
                    className="bg-brand-primary h-full rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${collection.completionPercentage}%` }}
                />
            </div>
        </div>
      </div>
    </div>
  );
};

export default CollectionItem;