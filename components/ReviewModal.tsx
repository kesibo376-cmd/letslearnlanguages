import React from 'react';
import { useTranslation } from '../contexts/LanguageContext';

interface ReviewModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  podcastName: string;
}

const ReviewModal: React.FC<ReviewModalProps> = ({ isOpen, onConfirm, onCancel, podcastName }) => {
  const { t } = useTranslation();

  return (
    <div 
      className={`fixed inset-0 bg-black z-50 flex items-center justify-center p-4 transition-opacity duration-300 ease-in-out ${isOpen ? 'bg-opacity-75' : 'bg-opacity-0 pointer-events-none'}`}
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-labelledby="review-title"
      aria-hidden={!isOpen}
    >
      <div 
        className={`bg-brand-surface rounded-lg shadow-2xl p-6 w-full max-w-sm b-border b-shadow mx-auto transition-all duration-300 ease-in-out ${isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="review-title" className="text-xl font-bold text-brand-text mb-4">{t('review.title')}</h2>
        <p className="text-brand-text-secondary mb-6">
          {t('review.prompt', { name: podcastName })}
        </p>
        <div className="flex justify-end gap-4">
          <button 
            onClick={onCancel}
            className="px-4 py-2 rounded-md bg-brand-surface-light text-brand-text hover:bg-opacity-75 transition-colors b-border transform hover:scale-105 active:scale-95"
          >
            {t('review.skip')}
          </button>
          <button 
            onClick={onConfirm}
            className="px-4 py-2 rounded-md bg-brand-primary text-brand-text-on-primary hover:bg-brand-primary-hover transition-colors b-border b-shadow b-shadow-hover transform hover:scale-105 active:scale-95"
          >
            {t('review.startReview')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReviewModal;