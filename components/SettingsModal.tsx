import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { Collection, Theme, StreakData, StreakDifficulty, CompletionSound, User, LayoutMode, Language, Podcast } from '../types';
import { formatBytes } from '../lib/utils';
import { db } from '../firebase';
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
import ShieldIcon from './icons/ShieldIcon';
import UserCheckIcon from './icons/UserCheckIcon';
import UserXIcon from './icons/UserXIcon';
import SyncIcon from './icons/SyncIcon';
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
  onUpdatePreloadedData: () => void;
  podcasts: Podcast[];
  collections: Collection[];
  setPodcasts: (podcasts: Podcast[]) => void;
}

const THEMES: { id: Theme; name: string }[] = [
  { id: 'charcoal', name: 'Charcoal' },
  { id: 'minecraft', name: 'Minecraft' },
  { id: 'minimal', name: 'Minimal' },
  { id: 'brutalist', name: 'Brutalist' },
  { id: 'cyber-brutalist', name: 'Cyber Brutalist' },
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
  { id: 'nice-shot', name: 'Wii Sports' },
  { id: 'qpuc', name: 'QPUC' },
  { id: 'reggie', name: 'Reggie' },
  { id: 'master-at-work', name: 'Master at Work' },
  { id: 'winnaar', name: 'Winnaar' },
  { id: 'random', name: 'Random' },
];

// Mock timestamp data for specific collections
const MOCK_TIMESTAMPS: Record<string, { time: number; label: string }[]> = {
  'jp-foundation': [
    { time: 5, label: 'Introduction' },
    { time: 25, label: 'Basic Greetings' },
    { time: 60, label: 'Core Vocabulary' },
    { time: 120, label: 'Practice Drill 1' },
    { time: 180, label: 'Conclusion' },
  ],
  'japanese-i': [
    { time: 10, label: 'Lesson Start' },
    { time: 45, label: 'Grammar Point' },
    { time: 90, label: 'Dialogue Practice' },
    { time: 150, label: 'Review' },
    { time: 210, label: 'Lesson End' },
  ],
};

const SettingsModal: React.FC<SettingsModalProps> = (props) => {
  const {
    isOpen, onClose, onResetProgress, onOpenClearDataModal, currentTheme, onSetTheme, onSetLanguage,
    streakData, onSetStreakData, hideCompleted, onSetHideCompleted, reviewModeEnabled,
    onSetReviewModeEnabled, customArtwork, onSetCustomArtwork, onExportData,
    onImportData, completionSound, onSetCompletionSound,
    useCollectionsView, onSetUseCollectionsView,
    playOnNavigate, onSetPlayOnNavigate, totalStorageUsed, user, onLogout, 
    playerLayout, onSetPlayerLayout, onUpdatePreloadedData,
    podcasts, collections, setPodcasts
  } = props;

  const { t, language } = useTranslation();
  const isAdmin = user.email === 'maxence.poskin@gmail.com';

  const CATEGORIES = [
    { id: 'account', label: t('settings.categories.account'), icon: UserIcon },
    { id: 'appearance', label: t('settings.categories.appearance'), icon: PaintBrushIcon },
    { id: 'features', label: t('settings.categories.features'), icon: SparklesIcon },
    { id: 'data', label: t('settings.categories.data'), icon: DatabaseIcon },
    ...(isAdmin ? [{ id: 'admin', label: 'Admin', icon: ShieldIcon }] : []),
    { id: 'danger', label: t('settings.categories.danger'), icon: WarningIcon, isDanger: true },
  ];

  const [activeCategory, setActiveCategory] = useState('account');
  const importInputRef = React.useRef<HTMLInputElement>(null);
  const [artworkUrl, setArtworkUrl] = useState(customArtwork || '');
  const [pendingUsers, setPendingUsers] = useState<{ id: string; email: string; createdAt?: any }[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false); 
  const [isFetchingTimestamps, setIsFetchingTimestamps] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState('');

  const eligibleCollections = useMemo(() => {
    const eligibleIds = Object.keys(MOCK_TIMESTAMPS);
    return collections.filter(c => eligibleIds.includes(c.id));
  }, [collections]);

  useEffect(() => {
    if (isOpen) {
      setActiveCategory('account');
      setArtworkUrl(customArtwork || '');
      setSelectedCollection('');
    }
  }, [isOpen, customArtwork]);

  const fetchPendingUsers = useCallback(async () => {
    if (!isAdmin) return;
    setIsLoadingUsers(true);
    try {
      const requestsSnapshot = await db.collection('user_requests')
        .where('status', '==', 'pending')
        .get();

      const usersList = requestsSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            email: data.email || 'No email',
            createdAt: data.createdAt || null,
          };
      });
      
      usersList.sort((a, b) => {
        if (!a.createdAt) return 1;
        if (!b.createdAt) return -1;
        return b.createdAt.toDate() - a.createdAt.toDate();
      });

      setPendingUsers(usersList);
    } catch (error) {
      console.error("Error fetching user requests:", error);
      alert("Could not fetch user requests.");
    }
    setIsLoadingUsers(false);
  }, [isAdmin]);


  useEffect(() => {
    if (isOpen && isAdmin && activeCategory === 'admin') {
      fetchPendingUsers();
    }
  }, [isOpen, isAdmin, activeCategory, fetchPendingUsers]);
  
  const handleUserApproval = async (userId: string, newStatus: 'approved' | 'denied') => {
    try {
      const userDocRef = db.collection('users').doc(userId);
      const requestDocRef = db.collection('user_requests').doc(userId);
      
      const batch = db.batch();
      batch.update(userDocRef, { status: newStatus });
      batch.update(requestDocRef, { status: newStatus });
      await batch.commit();

      setPendingUsers(prev => prev.filter(u => u.id !== userId));
    } catch (error) {
      console.error(`Error ${newStatus === 'approved' ? 'approving' : 'denying'} user:`, error);
      alert(`Failed to update user status.`);
    }
  };


  const handleArtworkSave = () => {
    onSetCustomArtwork(artworkUrl.trim() || null);
    alert('Artwork URL saved!');
  };

  const handleImportFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onImportData(file);
    }
    if (event.target) {
        event.target.value = '';
    }
  };

  const handleFetchTimestamps = () => {
    if (!selectedCollection) return;
    setIsFetchingTimestamps(true);

    const timestampsToApply = MOCK_TIMESTAMPS[selectedCollection];
    if (!timestampsToApply) {
        alert("No timestamp data available for this collection.");
        setIsFetchingTimestamps(false);
        return;
    }

    const updatedPodcasts = podcasts.map(p => {
        if (p.collectionId === selectedCollection) {
            return { ...p, timestamps: timestampsToApply };
        }
        return p;
    });

    setPodcasts(updatedPodcasts);

    setTimeout(() => {
        setIsFetchingTimestamps(false);
        alert(`Timestamps successfully fetched for the "${collections.find(c => c.id === selectedCollection)?.name}" collection!`);
    }, 1000); // Simulate network delay
  };


  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 flex justify-center items-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-brand-surface w-full max-w-4xl h-[90vh] rounded-lg shadow-2xl b-border b-shadow flex flex-col sm:flex-row overflow-hidden animate-scale-in"
        onClick={e => e.stopPropagation()}
      >
        <aside className="w-full sm:w-1/4 bg-brand-surface-light p-4 overflow-y-auto b-border">
          <h2 className="text-lg font-bold text-brand-text mb-6 px-2">{t('settings.title')}</h2>
          <nav className="space-y-1">
            {CATEGORIES.map(cat => (
              <button 
                key={cat.id} 
                onClick={() => setActiveCategory(cat.id)}
                className={`w-full text-left flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-sm font-semibold ${activeCategory === cat.id ? 'bg-brand-primary text-brand-text-on-primary' : `${cat.isDanger ? 'text-red-500 hover:bg-red-500/10' : 'text-brand-text-secondary hover:bg-brand-surface hover:text-brand-text'}`}`}
              >
                <cat.icon size={20} />
                {cat.label}
              </button>
            ))}
          </nav>
        </aside>

        <main className="flex-1 p-6 overflow-y-auto">
          {activeCategory === 'account' && (
            <section>
              <h3 className="text-2xl font-bold text-brand-text mb-6">{t('settings.categories.account')}</h3>
              <div className="space-y-4 max-w-md">
                 <div className="p-4 bg-brand-surface-light rounded-md b-border">
                   <p className="text-sm text-brand-text-secondary">{t('settings.account.loggedInAs')}</p>
                   <p className="font-semibold text-brand-text truncate">{user.email}</p>
                 </div>
                 <button onClick={onLogout} className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-brand-surface-light text-brand-text rounded-md hover:bg-opacity-75 transition-colors b-border b-shadow-hover">
                    <LogOutIcon size={18} />
                    <span className="font-semibold">{t('settings.account.logout')}</span>
                 </button>
              </div>
            </section>
          )}

          {activeCategory === 'appearance' && (
            <section>
              <h3 className="text-2xl font-bold text-brand-text mb-6">{t('settings.categories.appearance')}</h3>
              <div className="space-y-6 max-w-md">
                <div>
                  <h4 className="font-semibold text-brand-text mb-2">{t('settings.appearance.theme')}</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {THEMES.map(theme => (
                      <button key={theme.id} onClick={() => onSetTheme(theme.id)} className={`p-3 rounded-md text-center font-semibold b-border transition-all ${currentTheme === theme.id ? 'ring-2 ring-brand-primary ring-offset-2 ring-offset-brand-surface bg-brand-primary/10' : 'bg-brand-surface-light hover:bg-opacity-75'}`}>
                        {theme.name}
                      </button>
                    ))}
                  </div>
                </div>
                 <div>
                  <h4 className="font-semibold text-brand-text mb-2">{t('settings.appearance.language')}</h4>
                  <div className="flex gap-2">
                      <button onClick={() => onSetLanguage('en')} className={`p-3 rounded-md text-center font-semibold b-border transition-all flex-1 ${language === 'en' ? 'ring-2 ring-brand-primary ring-offset-2 ring-offset-brand-surface bg-brand-primary/10' : 'bg-brand-surface-light hover:bg-opacity-75'}`}>
                        {t('settings.appearance.english')}
                      </button>
                      <button onClick={() => onSetLanguage('zh')} className={`p-3 rounded-md text-center font-semibold b-border transition-all flex-1 ${language === 'zh' ? 'ring-2 ring-brand-primary ring-offset-2 ring-offset-brand-surface bg-brand-primary/10' : 'bg-brand-surface-light hover:bg-opacity-75'}`}>
                        {t('settings.appearance.chinese')}
                      </button>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-brand-text mb-2">{t('settings.appearance.artworkUrl')}</h4>
                   <div className="flex items-center gap-2">
                      <ImageIcon size={20} className="text-brand-text-secondary" />
                      <input type="url" value={artworkUrl} onChange={e => setArtworkUrl(e.target.value)} placeholder="https://example.com/image.png" className="flex-grow p-2 bg-brand-surface rounded-md b-border text-brand-text"/>
                   </div>
                   <div className="flex gap-2 mt-2">
                    <button onClick={handleArtworkSave} className="px-4 py-2 bg-brand-primary text-brand-text-on-primary rounded-md b-border b-shadow b-shadow-hover">{t('settings.appearance.save')}</button>
                    <button onClick={() => { setArtworkUrl(''); onSetCustomArtwork(null); }} className="px-4 py-2 bg-brand-surface-light rounded-md b-border b-shadow-hover">{t('settings.appearance.remove')}</button>
                   </div>
                </div>
              </div>
            </section>
          )}

          {activeCategory === 'features' && (
            <section>
              <h3 className="text-2xl font-bold text-brand-text mb-6">{t('settings.categories.features')}</h3>
              <div className="space-y-4 max-w-lg">
                <div className="flex items-center justify-between p-3 bg-brand-surface-light rounded-md b-border">
                  <div>
                    <p className="font-semibold text-brand-text">{t('settings.features.collections')}</p>
                    <p className="text-sm text-brand-text-secondary">{t('settings.features.collectionsSub')}</p>
                  </div>
                  <ToggleSwitch isOn={useCollectionsView} handleToggle={() => onSetUseCollectionsView(!useCollectionsView)} />
                </div>
                <div className="flex items-center justify-between p-3 bg-brand-surface-light rounded-md b-border">
                  <div>
                    <p className="font-semibold text-brand-text">{t('settings.features.circularPlayer')}</p>
                    <p className="text-sm text-brand-text-secondary">{t('settings.features.circularPlayerSub')}</p>
                  </div>
                  <ToggleSwitch isOn={playerLayout === 'pimsleur'} handleToggle={() => onSetPlayerLayout(playerLayout === 'pimsleur' ? 'default' : 'pimsleur')} />
                </div>
                <div className="flex items-center justify-between p-3 bg-brand-surface-light rounded-md b-border">
                  <div>
                    <p className="font-semibold text-brand-text">{t('settings.features.streak')}</p>
                    <p className="text-sm text-brand-text-secondary">{t('settings.features.streakSub')}</p>
                  </div>
                  <ToggleSwitch isOn={streakData.enabled} handleToggle={() => onSetStreakData({...streakData, enabled: !streakData.enabled})} />
                </div>
                {streakData.enabled && (
                  <div className="p-3 bg-brand-surface-light rounded-md b-border">
                    <h4 className="font-semibold text-brand-text mb-2">{t('settings.features.streakDifficulty')}</h4>
                    <div className="space-y-2">
                      {DIFFICULTIES.map(d => (
                        <div key={d.id} onClick={() => onSetStreakData({ ...streakData, difficulty: d.id })} className={`p-2 rounded-md cursor-pointer b-border flex items-center gap-3 ${streakData.difficulty === d.id ? 'bg-brand-primary/10 ring-2 ring-brand-primary' : 'hover:bg-brand-surface'}`}>
                           <input type="radio" name="difficulty" value={d.id} checked={streakData.difficulty === d.id} readOnly className="form-radio text-brand-primary focus:ring-brand-primary bg-brand-surface"/>
                           <div>
                            <p className="font-semibold text-brand-text">{t(d.name)}</p>
                            <p className="text-xs text-brand-text-secondary">{t(d.description)}</p>
                           </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                 <div className="flex items-center justify-between p-3 bg-brand-surface-light rounded-md b-border">
                  <div>
                    <p className="font-semibold text-brand-text">{t('settings.features.review')}</p>
                    <p className="text-sm text-brand-text-secondary">{t('settings.features.reviewSub')}</p>
                  </div>
                  <ToggleSwitch isOn={reviewModeEnabled} handleToggle={() => onSetReviewModeEnabled(!reviewModeEnabled)} />
                </div>
                 <div className="flex items-center justify-between p-3 bg-brand-surface-light rounded-md b-border">
                  <div>
                    <p className="font-semibold text-brand-text">{t('settings.features.autoplay')}</p>
                    <p className="text-sm text-brand-text-secondary">{t('settings.features.autoplaySub')}</p>
                  </div>
                  <ToggleSwitch isOn={playOnNavigate} handleToggle={() => onSetPlayOnNavigate(!playOnNavigate)} />
                </div>
                 <div className="flex items-center justify-between p-3 bg-brand-surface-light rounded-md b-border">
                  <div>
                    <p className="font-semibold text-brand-text">{t('settings.features.hideCompleted')}</p>
                    <p className="text-sm text-brand-text-secondary">{t('settings.features.hideCompletedSub')}</p>
                  </div>
                  <ToggleSwitch isOn={hideCompleted} handleToggle={() => onSetHideCompleted(!hideCompleted)} />
                </div>
                <div className="p-3 bg-brand-surface-light rounded-md b-border">
                    <label htmlFor="completion-sound" className="font-semibold text-brand-text">{t('settings.features.completionSound')}</label>
                    <select id="completion-sound" value={completionSound} onChange={(e) => onSetCompletionSound(e.target.value as CompletionSound)} className="w-full mt-2 p-2 bg-brand-surface rounded-md b-border text-brand-text">
                        {SOUNDS.map(sound => <option key={sound.id} value={sound.id}>{sound.name}</option>)}
                    </select>
                </div>
              </div>
            </section>
          )}

          {activeCategory === 'data' && (
            <section>
              <h3 className="text-2xl font-bold text-brand-text mb-6">{t('settings.data.title')}</h3>
              <div className="space-y-4 max-w-lg">
                <div className="p-3 bg-brand-surface-light rounded-md b-border">
                  <h4 className="font-semibold text-brand-text">{t('settings.data.storage')}</h4>
                  <p className="text-sm text-brand-text-secondary">{t('settings.data.storageSub', { size: formatBytes(totalStorageUsed) })}</p>
                </div>
                <button onClick={onUpdatePreloadedData} className="w-full text-left p-3 bg-brand-surface-light hover:bg-opacity-75 rounded-md transition-colors duration-200 b-border flex items-center gap-4">
                  <SyncIcon size={24} className="text-brand-primary"/>
                  <div>
                    <p className="font-semibold text-brand-text">{t('settings.data.update')}</p>
                    <p className="text-sm text-brand-text-secondary">{t('settings.data.updateSub')}</p>
                  </div>
                </button>
                <button onClick={onExportData} className="w-full text-left p-3 bg-brand-surface-light hover:bg-opacity-75 rounded-md transition-colors duration-200 b-border flex items-center gap-4">
                  <DownloadIcon size={24} className="text-brand-text-secondary"/>
                  <div>
                    <p className="font-semibold text-brand-text">{t('settings.data.export')}</p>
                    <p className="text-sm text-brand-text-secondary">{t('settings.data.exportSub')}</p>
                  </div>
                </button>
                <input type="file" accept=".json" ref={importInputRef} onChange={handleImportFileChange} className="hidden" />
                <button onClick={() => importInputRef.current?.click()} className="w-full text-left p-3 bg-brand-surface-light hover:bg-opacity-75 rounded-md transition-colors duration-200 b-border flex items-center gap-4">
                  <UploadIcon size={24} className="text-brand-text-secondary"/>
                  <div>
                    <p className="font-semibold text-brand-text">{t('settings.data.import')}</p>
                    <p className="text-sm text-brand-text-secondary">{t('settings.data.importSub')}</p>
                  </div>
                </button>
                
                <div className="p-3 bg-brand-surface-light rounded-md b-border">
                    <h4 className="font-semibold text-brand-text">Fetch Timestamps</h4>
                    <p className="text-sm text-brand-text-secondary mb-2">Fetch pre-defined timestamps for supported collections.</p>
                    <div className="flex flex-col sm:flex-row gap-2">
                        <select 
                            value={selectedCollection}
                            onChange={(e) => setSelectedCollection(e.target.value)}
                            className="w-full sm:flex-grow p-2 bg-brand-surface rounded-md b-border text-brand-text"
                            disabled={eligibleCollections.length === 0}
                        >
                            <option value="">Select a collection...</option>
                            {eligibleCollections.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                        <button 
                            onClick={handleFetchTimestamps}
                            disabled={!selectedCollection || isFetchingTimestamps}
                            className="px-4 py-2 bg-brand-primary text-brand-text-on-primary rounded-md b-border b-shadow b-shadow-hover disabled:bg-gray-500 disabled:cursor-not-allowed flex-shrink-0"
                        >
                            {isFetchingTimestamps ? 'Fetching...' : 'Fetch'}
                        </button>
                    </div>
                     {eligibleCollections.length === 0 && <p className="text-xs text-brand-text-secondary mt-2">No collections with available timestamp data found in your library.</p>}
                </div>
              </div>
            </section>
          )}
          
          {activeCategory === 'danger' && (
             <section>
              <h3 className="text-2xl font-bold text-red-500 mb-6">{t('settings.danger.title')}</h3>
               <div className="space-y-4 max-w-lg">
                <button 
                  onClick={() => { if(window.confirm(t('settings.danger.confirmReset'))) onResetProgress()}} 
                  className="w-full text-left p-3 bg-red-500/10 hover:bg-red-500/20 rounded-md transition-colors duration-200 b-border border-red-500/20"
                >
                  <p className="font-semibold text-red-500">{t('settings.danger.reset')}</p>
                  <p className="text-sm text-red-500/80">{t('settings.danger.resetSub')}</p>
                </button>
                 <button 
                  onClick={onOpenClearDataModal}
                  className="w-full text-left p-3 bg-red-500/10 hover:bg-red-500/20 rounded-md transition-colors duration-200 b-border border-red-500/20"
                >
                  <p className="font-semibold text-red-500">{t('settings.danger.delete')}</p>
                  <p className="text-sm text-red-500/80">{t('settings.danger.deleteSub')}</p>
                </button>
              </div>
            </section>
          )}
          
          {activeCategory === 'admin' && isAdmin && (
            <section>
              <h3 className="text-2xl font-bold text-brand-text mb-6">Admin Panel</h3>
              <div className="space-y-4 max-w-lg">
                <div className="p-4 bg-brand-surface-light rounded-md b-border">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-semibold text-brand-text">Pending User Requests</h4>
                    <button onClick={fetchPendingUsers} disabled={isLoadingUsers} className="p-1 rounded-full hover:bg-brand-surface disabled:opacity-50">
                      <SyncIcon size={18} className={isLoadingUsers ? 'animate-spin' : ''} />
                    </button>
                  </div>
                  {isLoadingUsers ? (
                    <p>Loading users...</p>
                  ) : pendingUsers.length === 0 ? (
                    <p className="text-sm text-brand-text-secondary">No pending requests.</p>
                  ) : (
                    <ul className="space-y-2">
                      {pendingUsers.map(u => (
                        <li key={u.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-2 bg-brand-surface rounded-md">
                          <div className="truncate mr-2">
                            <p className="font-mono text-sm text-brand-text" title={u.email}>{u.email}</p>
                            <p className="text-xs text-brand-text-secondary">{u.createdAt ? new Date(u.createdAt.toDate()).toLocaleString() : 'Date unavailable'}</p>
                          </div>
                          <div className="flex gap-2 mt-2 sm:mt-0">
                            <button onClick={() => handleUserApproval(u.id, 'approved')} className="p-2 bg-green-500/20 text-green-500 rounded-full hover:bg-green-500/30"><UserCheckIcon size={18} /></button>
                            <button onClick={() => handleUserApproval(u.id, 'denied')} className="p-2 bg-red-500/20 text-red-500 rounded-full hover:bg-red-500/30"><UserXIcon size={18} /></button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
};

export default SettingsModal;