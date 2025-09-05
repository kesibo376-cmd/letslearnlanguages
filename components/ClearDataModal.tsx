
import React from 'react';
import TrashIcon from './icons/TrashIcon';
import { useTranslation } from '../contexts/LanguageContext';

interface ClearDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClearLocal: () => void;
  onResetPreloaded: () => void;
  onClearAll: () => void;
}

const ClearDataModal: React.FC<ClearDataModalProps> = ({ isOpen, onClose, onClearLocal, onResetPreloaded, onClearAll }) => {
  const { t } = useTranslation();
  
  const handleClearLocalClick = () => {
    if (window.confirm(t('clearData.confirmLocal'))) {
        onClearLocal();
    }
  };
  
  const handleResetPreloadedClick = () => {
    if (window.confirm(t('clearData.confirmPreloaded'))) {
        onResetPreloaded();
    }
  };
  
  const handleClearAllClick = () => {
    if (window.confirm(t('clearData.confirmAll'))) {
        onClearAll();
    }
  };

  return (
    <div 
      className={`fixed inset-0 bg-black z-50 flex items-center justify-center p-4 transition-opacity duration-300 ease-in-out ${isOpen ? 'bg-opacity-75 backdrop-blur-sm' : 'bg-opacity-0 pointer-events-none'}`}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="clear-data-title"
      aria-hidden={!isOpen}
    >
      <div 
        className={`bg-brand-surface rounded-lg shadow-2xl p-6 w-full max-w-md b-border b-shadow mx-auto transition-all duration-300 ease-in-out ${isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
            <h2 id="clear-data-title" className="text-xl font-bold text-brand-text">{t('clearData.title')}</h2>
            <button onClick={onClose} aria-label="Close" className="text-brand-text-secondary hover:text-brand-text text-3xl leading-none">&times;</button>
        </div>
        <p className="text-brand-text-secondary mb-6">
            {t('clearData.prompt')}
        </p>

        <div className="space-y-3">
            <button 
                onClick={handleClearLocalClick}
                className="w-full text-left p-3 bg-brand-surface-light hover:bg-opacity-75 rounded-md transition-colors duration-200 b-border flex items-center gap-4"
            >
                <TrashIcon size={24} className="text-red-500 flex-shrink-0"/>
                <div>
                  <p className="font-semibold text-brand-text">{t('clearData.clearLocal')}</p>
                  <p className="text-sm text-brand-text-secondary">{t('clearData.clearLocalSub')}</p>
                </div>
            </button>
            <button 
                onClick={handleResetPreloadedClick}
                className="w-full text-left p-3 bg-brand-surface-light hover:bg-opacity-75 rounded-md transition-colors duration-200 b-border flex items-center gap-4"
            >
                <TrashIcon size={24} className="text-yellow-500 flex-shrink-0"/>
                <div>
                  <p className="font-semibold text-brand-text">{t('clearData.resetPreloaded')}</p>
                  <p className="text-sm text-brand-text-secondary">{t('clearData.resetPreloadedSub')}</p>
                </div>
            </button>
             <button 
                onClick={handleClearAllClick}
                className="w-full text-left p-3 bg-red-500/10 hover:bg-red-500/20 rounded-md transition-colors duration-200 b-border border-red-500/20 flex items-center gap-4"
            >
                <TrashIcon size={24} className="text-red-500 flex-shrink-0"/>
                <div>
                  <p className="font-semibold text-red-500">{t('clearData.clearAll')}</p>
                  <p className="text-sm text-red-500/80">{t('clearData.clearAllSub')}</p>
                </div>
            </button>
        </div>

      </div>
    </div>
  );
};
export default ClearDataModal;