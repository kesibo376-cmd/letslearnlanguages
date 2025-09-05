import React from 'react';
import { useTranslation } from '../contexts/LanguageContext';

interface StatusBarProps {
  listenedCount: number;
  totalCount: number;
  percentage: number;
}

const StatusBar: React.FC<StatusBarProps> = ({ listenedCount, totalCount, percentage }) => {
  const { t } = useTranslation();
  return (
    <div className="mt-4">
      <div className="flex justify-between items-center text-sm text-brand-text-secondary mb-1">
        <span className="font-semibold text-brand-text">{t('statusBar.complete', { percentage: Math.round(percentage) })}</span>
        <span>{t('statusBar.listened', { listenedCount, totalCount })}</span>
      </div>
      <div 
        className="w-full bg-brand-surface rounded-full h-2 b-border"
        role="progressbar"
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Audio listening progress"
      >
        <div 
          className="bg-brand-primary h-full transition-all duration-500 ease-out" 
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
};

export default StatusBar;