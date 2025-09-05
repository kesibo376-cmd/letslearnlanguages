import React, { useState, useEffect } from 'react';
import type { Collection } from '../types';
import { useTranslation } from '../contexts/LanguageContext';

interface CategorizeModalProps {
  isOpen: boolean;
  onClose: () => void;
  collections: Collection[];
  podcastCount: number;
  onCreateAndAssign: (name: string) => void;
  onAssign: (collectionId: string) => void;
}

const CategorizeModal: React.FC<CategorizeModalProps> = ({ isOpen, onClose, collections, podcastCount, onCreateAndAssign, onAssign }) => {
  const [selectedCollection, setSelectedCollection] = useState<string>('');
  const [newCollectionName, setNewCollectionName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    if (isOpen) {
      // Reset state when modal opens
      setIsCreating(false);
      setNewCollectionName('');
      // Pre-select the first collection if it exists
      setSelectedCollection(collections.length > 0 ? collections[0].id : '');
    }
  }, [isOpen, collections]);

  const handleSubmit = () => {
    if (isCreating) {
      if (newCollectionName.trim()) {
        onCreateAndAssign(newCollectionName.trim());
      }
    } else {
      if (selectedCollection) {
        onAssign(selectedCollection);
      }
    }
  };
  
  return (
    <div 
      className={`fixed inset-0 bg-black z-50 flex items-center justify-center p-4 transition-opacity duration-300 ease-in-out ${isOpen ? 'bg-opacity-75 backdrop-blur-sm' : 'bg-opacity-0 pointer-events-none'}`}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="categorize-title"
      aria-hidden={!isOpen}
    >
      <div 
        className={`bg-brand-surface rounded-lg shadow-2xl p-6 w-full max-w-sm b-border b-shadow mx-auto transition-all duration-300 ease-in-out ${isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="categorize-title" className="text-xl font-bold text-brand-text mb-2">{t('categorize.title')}</h2>
        <p className="text-brand-text-secondary mb-6">
          {podcastCount === 1 ? t('categorize.prompt_one') : t('categorize.prompt_other', { count: podcastCount })}
        </p>
        
        {isCreating ? (
          <div className="mb-4">
            <label htmlFor="new-collection-name" className="block text-sm font-medium text-brand-text-secondary mb-1">{t('categorize.newCollectionLabel')}</label>
            <input
              id="new-collection-name"
              type="text"
              value={newCollectionName}
              onChange={(e) => setNewCollectionName(e.target.value)}
              placeholder={t('categorize.newCollectionPlaceholder')}
              className="w-full p-2 bg-brand-surface-light rounded-md b-border text-brand-text"
              autoFocus
            />
            {collections.length > 0 && (
                <button onClick={() => setIsCreating(false)} className="text-sm text-brand-primary mt-2 hover:underline">{t('categorize.selectExisting')}</button>
            )}
          </div>
        ) : (
          <div className="mb-4">
            <label htmlFor="collection-select" className="block text-sm font-medium text-brand-text-secondary mb-1">{t('categorize.selectCollectionLabel')}</label>
            <select
              id="collection-select"
              value={selectedCollection}
              onChange={(e) => setSelectedCollection(e.target.value)}
              className="w-full p-2 bg-brand-surface-light rounded-md b-border text-brand-text"
              disabled={collections.length === 0}
            >
              <option value="" disabled>{t('categorize.selectCollectionPlaceholder')}</option>
              {collections.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <button onClick={() => setIsCreating(true)} className="text-sm text-brand-primary mt-2 hover:underline">{t('categorize.createNew')}</button>
          </div>
        )}

        <div className="flex justify-end gap-4">
          <button 
            onClick={onClose}
            className="px-4 py-2 rounded-md bg-brand-surface-light text-brand-text hover:bg-opacity-75 transition-colors b-border transform hover:scale-105 active:scale-95"
          >
            {t('categorize.later')}
          </button>
          <button 
            onClick={handleSubmit}
            disabled={isCreating ? !newCollectionName.trim() : !selectedCollection}
            className="px-4 py-2 rounded-md bg-brand-primary text-brand-text-on-primary hover:bg-brand-primary-hover transition-colors b-border b-shadow b-shadow-hover transform hover:scale-105 active:scale-95 disabled:bg-gray-500 disabled:cursor-not-allowed"
          >
            {t('categorize.assign')}
          </button>
        </div>
      </div>
    </div>
  );
};
export default CategorizeModal;