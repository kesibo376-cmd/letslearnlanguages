

import React, { useState, useEffect } from 'react';
import type { Theme, StreakData, StreakDifficulty, CompletionSound, User, LayoutMode, Language } from '../types';
import { formatBytes } from '../lib/utils';
import ToggleSwitch from './ToggleSwitch';
import ImageIcon from './icons/ImageIcon';
import DownloadIcon from './icons/DownloadIcon';
import UploadIcon from './icons/UploadIcon';
import DatabaseIcon from './icons/DatabaseIcon';
import LogOutIcon from './icons/LogOutIcon';
import UserIcon from './icons/UserIcon';
import PaintBrushIcon from './icons/PaintBrushIcon';
import SparklesIcon from './icons/SparklesIcon';
import WarningIcon from './icons/WarningIcon';
import { useTranslation } from '../contexts/LanguageContext';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onResetProgress: () => void;
  onOpenClearDataModal: () => void;
  currentTheme: Theme;
  onSetTheme: (theme: Theme) => void;
  onSetLanguage: (language: Language) => void;
  streakData: StreakData;
  onSetStreakData: (data: StreakData) => void;
  hideCompleted: boolean;
  onSetHideCompleted: (value: boolean) => void;
  reviewModeEnabled: boolean;
  onSetReviewModeEnabled: (value: boolean) => void;
  customArtwork: string | null;
  onSetCustomArtwork: (url: string | null) => void;
  onExportData: () => void;
  onImportData: (file: File) => void;
  completionSound: CompletionSound;
  onSetCompletionSound: (sound: CompletionSound) => void;
  useCollectionsView: boolean;
  onSetUseCollectionsView: (value: boolean) => void;
  playOnNavigate: boolean;
  onSetPlayOnNavigate: (value: boolean) => void;
  playerLayout: LayoutMode;
  onSetPlayerLayout: (layout: LayoutMode) => void;
  totalStorageUsed: number;
  user: User;
  onLogout: () => void;
}

const THEMES: { id: Theme; name: string }[] = [
  { id: 'charcoal', name: 'Charcoal' },
  { id: 'minecraft', name: 'Minecraft' },
  { id: 'minimal', name: 'Minimal' },
  { id: 'hand-drawn', name: 'Hand-drawn' },
  { id: 'brutalist', name: 'Brutalist' },
  { id: 'retro-web', name: 'Retro Web' },
];

const DIFFICULTIES: { id: StreakDifficulty, name: string, description: string }[] = [
    { id: 'easy', name: 'settings.features.difficultyEasy', description: 'settings.features.difficultyEasySub' },
    { id: 'normal', name: 'settings.features.difficultyNormal', description: 'settings.features.difficultyNormalSub' },
    { id: 'hard', name: 'settings.features.difficultyHard', description: 'settings.features.difficultyHardSub' },
    { id: 'extreme', name: 'settings.features.difficultyExtreme', description: 'settings.features.difficultyExtremeSub' },
];

const SOUNDS: { id: CompletionSound; name: string }[] = [
  { id: 'none', name: 'None' },
  { id: 'minecraft', name: 'Minecraft' },
  { id: 'pokemon', name: 'Pokémon' },
  { id: 'otherday', name: 'OtherDay' },
  { id: 'runescape', name: 'RuneScape' },
  { id: 'random', name: 'Random' },
];

const SettingsModal: React.FC<SettingsModalProps> = (props) => {
  const {
    isOpen, onClose, onResetProgress, onOpenClearDataModal, currentTheme, onSetTheme, onSetLanguage,
    streakData, onSetStreakData, hideCompleted, onSetHideCompleted, reviewModeEnabled,
    onSetReviewModeEnabled, customArtwork, onSetCustomArtwork, onExportData,
    onImportData, completionSound, onSetCompletionSound, useCollectionsView,
    onSetUseCollectionsView, playOnNavigate, onSetPlayOnNavigate, totalStorageUsed,
    user, onLogout, playerLayout, onSetPlayerLayout
  } = props;

  const { t, language } = useTranslation();
  
  const CATEGORIES = [
    { id: 'account', label: t('settings.categories.account'), icon: UserIcon },
    { id: 'appearance', label: t('settings.categories.appearance'), icon: PaintBrushIcon },
    { id: 'features', label: t('settings.categories.features'), icon: SparklesIcon },
    { id: 'data', label: t('settings.categories.data'), icon: DatabaseIcon },
    { id: 'danger', label: t('settings.categories.danger'), icon: WarningIcon, isDanger: true },
  ];

  const [activeCategory, setActiveCategory] = useState('account');
  const importInputRef = React.useRef<HTMLInputElement>(null);
  const [artworkUrl, setArtworkUrl] = useState(customArtwork || '');

  useEffect(() => {
    if (isOpen) {
      setActiveCategory('account');
      setArtworkUrl(customArtwork || '');
    }
  }, [isOpen, customArtwork]);

  const handleResetClick = () => {
    if (window.confirm(t('settings.danger.confirmReset'))) {
        onResetProgress();
        onClose();
    }
  };
  
  const handleStreakToggle = () => {
      onSetStreakData({ ...streakData, enabled: !streakData.enabled });
  }
  
  const handleDifficultyChange = (difficulty: StreakDifficulty) => {
      onSetStreakData({...streakData, difficulty });
  }

  const handleImportFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onImportData(file);
    }
    if (event.target) {
        event.target.value = '';
    }
  };

  const handleArtworkSave = () => {
      // Basic URL validation
      if (artworkUrl && !artworkUrl.match(/^(https?|data):/)) {
          alert('Please enter a valid image URL (starting with http://, https://, or data:).');
          return;
      }
      onSetCustomArtwork(artworkUrl.trim() || null);
      // Maybe show a success message? For now, it just saves.
  };

  const handleArtworkRemove = () => {
      setArtworkUrl('');
      onSetCustomArtwork(null);
  };
  
  // Section Components for Readability
  const AccountSection = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-brand-text border-b border-brand-surface-light pb-2">{t('settings.categories.account')}</h3>
      <div className="p-3 bg-brand-surface-light rounded-md b-border flex items-center justify-between gap-4">
        <p className="text-sm text-brand-text-secondary truncate">
          {t('settings.account.loggedInAs')} <strong className="text-brand-text">{user?.email}</strong>
        </p>
        <button onClick={onLogout} className="flex-shrink-0 flex items-center gap-2 text-sm text-center px-3 py-2 bg-brand-surface hover:bg-opacity-75 rounded-md transition-colors duration-200 b-border">
          <LogOutIcon size={16} />
          {t('settings.account.logout')}
        </button>
      </div>
    </div>
  );
  
  const AppearanceSection = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-brand-text border-b border-brand-surface-light pb-2">{t('settings.categories.appearance')}</h3>
      <div>
        <label className="block text-sm font-medium text-brand-text-secondary mb-2">{t('settings.appearance.language')}</label>
        <div className="grid grid-cols-2 gap-2">
            <button onClick={() => onSetLanguage('en')} className={`w-full text-center p-2 text-sm rounded-md transition-colors duration-200 b-border ${language === 'en' ? 'active' : 'bg-brand-surface-light hover:bg-opacity-75'}`}>
                {t('settings.appearance.english')}
            </button>
            <button onClick={() => onSetLanguage('zh')} className={`w-full text-center p-2 text-sm rounded-md transition-colors duration-200 b-border ${language === 'zh' ? 'active' : 'bg-brand-surface-light hover:bg-opacity-75'}`}>
                {t('settings.appearance.chinese')}
            </button>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-brand-text-secondary mb-2">{t('settings.appearance.theme')}</label>
        <div className="grid grid-cols-2 gap-2">
          {THEMES.map(theme => (
            <button key={theme.id} onClick={() => onSetTheme(theme.id)} className={`w-full text-center p-2 text-sm rounded-md transition-colors duration-200 b-border ${currentTheme === theme.id ? 'active' : 'bg-brand-surface-light hover:bg-opacity-75'}`}>
              {theme.name}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label htmlFor="artwork-url-input" className="block text-sm font-medium text-brand-text-secondary mb-2">{t('settings.appearance.artworkUrl')}</label>
        <div className="p-3 bg-brand-surface-light rounded-md b-border flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 bg-brand-surface rounded-md b-border flex-shrink-0 flex items-center justify-center overflow-hidden">
              {customArtwork ? <img src={customArtwork} alt="Custom artwork preview" className="w-full h-full object-cover" /> : <ImageIcon size={24} className="text-brand-text-secondary"/>}
            </div>
            <input
                id="artwork-url-input"
                type="url"
                value={artworkUrl}
                onChange={(e) => setArtworkUrl(e.target.value)}
                placeholder="https://example.com/image.png"
                className="w-full px-3 py-2 bg-brand-surface rounded-md b-border text-brand-text placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-primary"
            />
          </div>
          <div className="flex gap-2 justify-end">
            {customArtwork && <button onClick={handleArtworkRemove} className="text-sm px-3 py-1.5 bg-brand-surface hover:bg-opacity-75 rounded-md transition-colors duration-200 b-border text-red-500">{t('settings.appearance.remove')}</button>}
            <button onClick={handleArtworkSave} className="text-sm px-4 py-1.5 bg-brand-primary text-brand-text-on-primary hover:bg-brand-primary-hover rounded-md transition-colors duration-200 b-border">{t('settings.appearance.save')}</button>
          </div>
        </div>
      </div>
    </div>
  );

  const FeaturesSection = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-brand-text border-b border-brand-surface-light pb-2">{t('settings.categories.features')}</h3>
      <div className="flex items-center justify-between p-3 bg-brand-surface-light rounded-md b-border">
        <div><p className="font-semibold">{t('settings.features.collections')}</p><p className="text-sm text-brand-text-secondary">{t('settings.features.collectionsSub')}</p></div>
        <div className={currentTheme === 'brutalist' ? 'p-2 -m-2' : ''}>
            <ToggleSwitch isOn={useCollectionsView} handleToggle={() => onSetUseCollectionsView(!useCollectionsView)} />
        </div>
      </div>
      <div className="flex items-center justify-between p-3 bg-brand-surface-light rounded-md b-border">
        <div><p className="font-semibold">{t('settings.features.streak')}</p><p className="text-sm text-brand-text-secondary">{t('settings.features.streakSub')}</p></div>
        <div className={currentTheme === 'brutalist' ? 'p-2 -m-2' : ''}>
            <ToggleSwitch isOn={streakData.enabled} handleToggle={handleStreakToggle} />
        </div>
      </div>
      <div className={`p-3 bg-brand-surface-light rounded-md b-border transition-opacity ${!streakData.enabled ? 'opacity-50 pointer-events-none' : ''}`}>
        <p className="font-semibold mb-2">{t('settings.features.streakDifficulty')}</p>
        <div className="flex flex-col space-y-2 streak-difficulty-options">
          {DIFFICULTIES.map(d => (
            <button key={d.id} onClick={() => handleDifficultyChange(d.id)} disabled={!streakData.enabled} className={`w-full text-left px-2 py-3 rounded-md transition-colors duration-200 flex items-center justify-between text-sm b-border ${streakData.difficulty === d.id ? 'active' : 'bg-brand-surface hover:bg-opacity-75'}`}>
                <div><span className="font-semibold">{t(d.name)}</span><span className="text-xs ml-2 opacity-80">{t(d.description)}</span></div>
            </button>
          ))}
        </div>
      </div>
      <div className="flex items-center justify-between p-3 bg-brand-surface-light rounded-md b-border">
        <div><p className="font-semibold">{t('settings.features.review')}</p><p className="text-sm text-brand-text-secondary">{t('settings.features.reviewSub')}</p></div>
        <div className={currentTheme === 'brutalist' ? 'p-2 -m-2' : ''}>
            <ToggleSwitch isOn={reviewModeEnabled} handleToggle={() => onSetReviewModeEnabled(!reviewModeEnabled)} />
        </div>
      </div>
      <div className="flex items-center justify-between p-3 bg-brand-surface-light rounded-md b-border">
        <div><p className="font-semibold">{t('settings.features.autoplay')}</p><p className="text-sm text-brand-text-secondary">{t('settings.features.autoplaySub')}</p></div>
        <div className={currentTheme === 'brutalist' ? 'p-2 -m-2' : ''}>
            <ToggleSwitch isOn={playOnNavigate} handleToggle={() => onSetPlayOnNavigate(!playOnNavigate)} />
        </div>
      </div>
      <div className="flex items-center justify-between p-3 bg-brand-surface-light rounded-md b-border">
        <div><p className="font-semibold">{t('settings.features.hideCompleted')}</p><p className="text-sm text-brand-text-secondary">{t('settings.features.hideCompletedSub')}</p></div>
        <div className={currentTheme === 'brutalist' ? 'p-2 -m-2' : ''}>
            <ToggleSwitch isOn={hideCompleted} handleToggle={() => onSetHideCompleted(!hideCompleted)} />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-brand-text-secondary mb-2">{t('settings.features.completionSound')}</label>
        <select value={completionSound} onChange={(e) => onSetCompletionSound(e.target.value as CompletionSound)} className="w-full p-2 bg-brand-surface-light rounded-md b-border text-brand-text">
            {SOUNDS.map(sound => <option key={sound.id} value={sound.id}>{sound.name}</option>)}
        </select>
      </div>
    </div>
  );

  const DataSection = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-brand-text border-b border-brand-surface-light pb-2">{t('settings.data.title')}</h3>
      <div className="p-3 bg-brand-surface-light rounded-md b-border flex items-center gap-3">
        <DatabaseIcon size={24} className="text-brand-text-secondary flex-shrink-0"/>
        <div><p className="font-semibold">{t('settings.data.storage')}</p><p className="text-sm text-brand-text-secondary">{t('settings.data.storageSub', { size: formatBytes(totalStorageUsed) })}</p></div>
      </div>
      <button onClick={onExportData} className="w-full text-left p-3 bg-brand-surface-light hover:bg-opacity-75 rounded-md transition-colors duration-200 b-border flex items-center gap-3">
        <DownloadIcon size={20} className="text-brand-text-secondary flex-shrink-0"/>
        <div><p className="font-semibold">{t('settings.data.export')}</p><p className="text-sm text-brand-text-secondary">{t('settings.data.exportSub')}</p></div>
      </button>
      <input type="file" accept=".json" ref={importInputRef} onChange={handleImportFileChange} className="hidden" aria-label="Import progress file" />
      <button onClick={() => importInputRef.current?.click()} className="w-full text-left p-3 bg-brand-surface-light hover:bg-opacity-75 rounded-md transition-colors duration-200 b-border flex items-center gap-3">
        <UploadIcon size={20} className="text-brand-text-secondary flex-shrink-0"/>
        <div><p className="font-semibold">{t('settings.data.import')}</p><p className="text-sm text-brand-text-secondary">{t('settings.data.importSub')}</p></div>
      </button>
    </div>
  );
  
  const DangerSection = () => (
    <div className="space-y-4 p-4 rounded-lg border-2 border-red-500/50">
      <h3 className="text-lg font-semibold text-red-500">{t('settings.danger.title')}</h3>
      <button onClick={handleResetClick} className="w-full text-left p-3 bg-red-500/10 hover:bg-red-500/20 rounded-md transition-colors duration-200 b-border border-red-500/20">
        <p className="font-semibold text-red-500">{t('settings.danger.reset')}</p><p className="text-sm text-red-500/80">{t('settings.danger.resetSub')}</p>
      </button>
      <button onClick={onOpenClearDataModal} className="w-full text-left p-3 bg-red-500/10 hover:bg-red-500/20 rounded-md transition-colors duration-200 b-border border-red-500/20">
        <p className="font-semibold text-red-500">{t('settings.danger.delete')}</p><p className="text-sm text-red-500/80">{t('settings.danger.deleteSub')}</p>
      </button>
    </div>
  );
  
  const renderContent = (category: string) => {
    switch (category) {
      case 'account': return <AccountSection />;
      case 'appearance': return <AppearanceSection />;
      case 'features': return <FeaturesSection />;
      case 'data': return <DataSection />;
      case 'danger': return <DangerSection />;
      default: return null;
    }
  };

  return (
    <div 
      className={`fixed inset-0 bg-black z-40 p-4 transition-opacity duration-300 ease-in-out ${isOpen ? 'bg-opacity-75 backdrop-blur-sm' : 'bg-opacity-0 pointer-events-none'}`}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-title"
      aria-hidden={!isOpen}
    >
      <div 
        className={`bg-brand-surface rounded-lg shadow-2xl p-6 w-full max-w-sm md:max-w-3xl lg:max-w-4xl b-border b-shadow mx-auto my-8 transition-all duration-300 ease-in-out ${isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 id="settings-title" className="text-xl font-bold text-brand-text">{t('settings.title')}</h2>
          <button onClick={onClose} aria-label="Close settings" className="text-brand-text-secondary hover:text-brand-text text-3xl leading-none">&times;</button>
        </div>
        
        <div className="md:flex md:gap-8">
            {/* Desktop Navigation */}
            <aside className="hidden md:block w-48 flex-shrink-0">
                <nav className="space-y-1">
                    {CATEGORIES.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => setActiveCategory(cat.id)}
                            className={`w-full flex items-center gap-3 text-left px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                                activeCategory === cat.id
                                ? (cat.isDanger ? 'bg-red-500/10 text-red-500' : 'bg-brand-primary/10 text-brand-primary')
                                : (cat.isDanger ? 'text-red-500 hover:bg-red-500/10' : 'text-brand-text-secondary hover:text-brand-text hover:bg-brand-surface-light')
                            }`}
                        >
                            <cat.icon size={18} />
                            <span>{cat.label}</span>
                        </button>
                    ))}
                </nav>
            </aside>
            
            <div className="flex-grow min-w-0">
              {/* Mobile View */}
              <div className="space-y-6 max-h-[80vh] overflow-y-auto pr-2 -mr-2 md:hidden">
                <AccountSection />
                <AppearanceSection />
                <FeaturesSection />
                <DataSection />
                <DangerSection />
              </div>

              {/* Desktop View */}
              <div className="hidden md:block max-h-[65vh] overflow-y-auto pr-3 -mr-2">
                {renderContent(activeCategory)}
              </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;