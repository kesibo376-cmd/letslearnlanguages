import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { Collection, Theme, StreakData, StreakDifficulty, CompletionSound, User, LayoutMode, Language, Podcast } from '../types';
import { formatBytes } from '../lib/utils';
import { db as firestore } from '../firebase';
import * as db from '../lib/db';
import ToggleSwitch from './ToggleSwitch';
import ImageIcon from './icons/ImageIcon';
import DownloadIcon from './icons/DownloadIcon';
import UploadIcon from './icons/UploadIcon';
import LogOutIcon from './icons/LogOutIcon';
import UserIcon from './icons/UserIcon';
import PaintBrushIcon from './icons/PaintBrushIcon';
import SparklesIcon from './icons/SparklesIcon';
import WarningIcon from './icons/WarningIcon';
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
  const importInputRef = React.useRef<HTMLInputElement>(null);

  const [activeCategory, setActiveCategory] = useState('account');
  const [artworkUrl, setArtworkUrl] = useState(customArtwork || '');
  const [pendingUsers, setPendingUsers] = useState<{ id: string; email: string; createdAt?: any }[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false); 
  const [isFetchingDurations, setIsFetchingDurations] = useState(false);

  const categories = useMemo(() => [
    { id: 'account', name: t('settings.categories.account'), icon: UserIcon },
    { id: 'appearance', name: t('settings.categories.appearance'), icon: PaintBrushIcon },
    { id: 'features', name: t('settings.categories.features'), icon: SparklesIcon },
    { id: 'data', name: t('settings.data.title'), icon: UploadIcon },
    ...(isAdmin ? [{ id: 'admin', name: 'Admin', icon: UserCheckIcon }] : []),
    { id: 'danger', name: t('settings.danger.title'), icon: WarningIcon },
  ], [t, isAdmin]);

  useEffect(() => {
    if (isOpen) {
      setArtworkUrl(customArtwork || '');
    }
  }, [isOpen, customArtwork]);

  const fetchPendingUsers = useCallback(async () => {
    if (!isAdmin) return;
    setIsLoadingUsers(true);
    try {
      const requestsSnapshot = await firestore.collection('user_requests').where('status', '==', 'pending').get();
      const usersList = requestsSnapshot.docs.map(doc => {
          const data = doc.data();
          return { id: doc.id, email: data.email || 'No email', createdAt: data.createdAt || null };
      });
      usersList.sort((a, b) => a.createdAt && b.createdAt ? b.createdAt.toDate() - a.createdAt.toDate() : 0);
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
      const batch = firestore.batch();
      batch.update(firestore.collection('users').doc(userId), { status: newStatus });
      batch.update(firestore.collection('user_requests').doc(userId), { status: newStatus });
      await batch.commit();
      setPendingUsers(prev => prev.filter(u => u.id !== userId));
    } catch (error) {
      console.error(`Error ${newStatus} user:`, error);
      alert(`Failed to update user status.`);
    }
  };

  const handleArtworkSave = () => {
    onSetCustomArtwork(artworkUrl.trim() || null);
    alert('Artwork URL saved!');
  };

  const handleImportFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) onImportData(file);
    if (event.target) event.target.value = '';
  };

    const handleFetchDurations = async () => {
        setIsFetchingDurations(true);
        const podcastsToUpdate = podcasts.filter(p => p.duration === 0);

        if (podcastsToUpdate.length === 0) {
            alert("All audio files already have durations.");
            setIsFetchingDurations(false);
            return;
        }

        const updatedPodcasts = [...podcasts];
        let successCount = 0;

        const getDuration = (src: string): Promise<number> => {
            return new Promise((resolve, reject) => {
                const audio = document.createElement('audio');
                audio.preload = 'metadata';
                audio.onloadedmetadata = () => {
                    URL.revokeObjectURL(audio.src);
                    resolve(audio.duration);
                    audio.remove();
                };
                audio.onerror = () => {
                    URL.revokeObjectURL(audio.src);
                    console.error(`Error loading metadata for src: ${src}`);
                    reject(new Error('Failed to load audio metadata.'));
                    audio.remove();
                };
                audio.src = src;
            });
        };

        for (const podcast of podcastsToUpdate) {
            let objectUrl: string | undefined;
            try {
                let audioSrc: string;
                if (podcast.storage === 'indexeddb') {
                    const blob = await db.getAudio(podcast.id);
                    if (!blob) throw new Error('Audio blob not found in IndexedDB');
                    objectUrl = URL.createObjectURL(blob);
                    audioSrc = objectUrl;
                } else {
                    audioSrc = podcast.url;
                }
                
                const duration = await getDuration(audioSrc);

                const index = updatedPodcasts.findIndex(p => p.id === podcast.id);
                if (index !== -1 && isFinite(duration) && duration > 0) {
                    updatedPodcasts[index] = { ...updatedPodcasts[index], duration };
                    successCount++;
                }
            } catch (error) {
                console.error(`Failed to fetch duration for "${podcast.name}":`, error);
            } finally {
                if (objectUrl) URL.revokeObjectURL(objectUrl);
            }
        }

        setPodcasts(updatedPodcasts);
        setIsFetchingDurations(false);
        alert(`Successfully fetched durations for ${successCount} of ${podcastsToUpdate.length} audio files.`);
    };

  const renderContent = () => {
    switch (activeCategory) {
      case 'account':
        return (
          <section>
            <h3 className="text-xl font-bold text-brand-text mb-4">{t('settings.categories.account')}</h3>
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
        );
      case 'appearance':
        return (
          <section>
            <h3 className="text-xl font-bold text-brand-text mb-4">{t('settings.categories.appearance')}</h3>
            <div className="space-y-6 max-w-md">
              <div>
                <h4 className="font-semibold text-brand-text mb-2">{t('settings.appearance.theme')}</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {THEMES.map(theme => (
                    <button key={theme.id} onClick={() => onSetTheme(theme.id)} className={`p-3 rounded-md text-center font-semibold b-border transition-all ${currentTheme === theme.id ? 'ring-2 ring-brand-primary ring-offset-2 ring-offset-brand-surface bg-brand-primary/10' : 'bg-brand-surface-light hover:bg-opacity-75'}`}>{theme.name}</button>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-brand-text mb-2">{t('settings.appearance.language')}</h4>
                <div className="flex gap-2">
                  <button onClick={() => onSetLanguage('en')} className={`p-3 rounded-md text-center font-semibold b-border transition-all flex-1 ${language === 'en' ? 'ring-2 ring-brand-primary ring-offset-2 ring-offset-brand-surface bg-brand-primary/10' : 'bg-brand-surface-light hover:bg-opacity-75'}`}>{t('settings.appearance.english')}</button>
                  <button onClick={() => onSetLanguage('zh')} className={`p-3 rounded-md text-center font-semibold b-border transition-all flex-1 ${language === 'zh' ? 'ring-2 ring-brand-primary ring-offset-2 ring-offset-brand-surface bg-brand-primary/10' : 'bg-brand-surface-light hover:bg-opacity-75'}`}>{t('settings.appearance.chinese')}</button>
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
        );
      case 'features':
        return (
          <section>
            <h3 className="text-xl font-bold text-brand-text mb-4">{t('settings.categories.features')}</h3>
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
        );
       case 'data':
        return (
          <section>
            <h3 className="text-xl font-bold text-brand-text mb-4">{t('settings.data.title')}</h3>
            <div className="space-y-4 max-w-lg">
              <div className="p-3 bg-brand-surface-light rounded-md b-border">
                <h4 className="font-semibold text-brand-text">{t('settings.data.storage')}</h4>
                <p className="text-sm text-brand-text-secondary">{t('settings.data.storageSub', { size: formatBytes(totalStorageUsed) })}</p>
              </div>
              <button onClick={onUpdatePreloadedData} className="w-full text-left p-3 bg-brand-surface-light hover:bg-opacity-75 rounded-md transition-colors duration-200 b-border flex items-center gap-4">
                <SyncIcon size={24} className="text-brand-primary"/>
                <div><p className="font-semibold text-brand-text">{t('settings.data.update')}</p><p className="text-sm text-brand-text-secondary">{t('settings.data.updateSub')}</p></div>
              </button>
              <button onClick={onExportData} className="w-full text-left p-3 bg-brand-surface-light hover:bg-opacity-75 rounded-md transition-colors duration-200 b-border flex items-center gap-4">
                <DownloadIcon size={24} className="text-brand-text-secondary"/>
                <div><p className="font-semibold text-brand-text">{t('settings.data.export')}</p><p className="text-sm text-brand-text-secondary">{t('settings.data.exportSub')}</p></div>
              </button>
              <input type="file" accept=".json" ref={importInputRef} onChange={handleImportFileChange} className="hidden" />
              <button onClick={() => importInputRef.current?.click()} className="w-full text-left p-3 bg-brand-surface-light hover:bg-opacity-75 rounded-md transition-colors duration-200 b-border flex items-center gap-4">
                <UploadIcon size={24} className="text-brand-text-secondary"/>
                <div><p className="font-semibold text-brand-text">{t('settings.data.import')}</p><p className="text-sm text-brand-text-secondary">{t('settings.data.importSub')}</p></div>
              </button>
               <div className="p-3 bg-brand-surface-light rounded-md b-border">
                    <h4 className="font-semibold text-brand-text">Fetch Audio Durations</h4>
                    <p className="text-sm text-brand-text-secondary mb-3">Scan library and fetch durations for any audio files showing '0:00'.</p>
                    <button 
                        onClick={handleFetchDurations} 
                        disabled={isFetchingDurations} 
                        className="w-full sm:w-auto px-4 py-2 bg-brand-primary text-brand-text-on-primary rounded-md b-border b-shadow b-shadow-hover disabled:bg-gray-500 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isFetchingDurations ? (
                            <>
                                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                <span>Fetching...</span>
                            </>
                        ) : 'Fetch Durations'}
                    </button>
                </div>
            </div>
          </section>
        );
      case 'admin':
        return (
          <section>
            <h3 className="text-xl font-bold text-brand-text mb-4">Admin Panel</h3>
            <div className="space-y-4 max-w-lg">
              <div className="p-4 bg-brand-surface-light rounded-md b-border">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-semibold text-brand-text">Pending User Requests</h4>
                  <button onClick={fetchPendingUsers} disabled={isLoadingUsers} className="p-1 rounded-full hover:bg-brand-surface disabled:opacity-50"><SyncIcon size={18} className={isLoadingUsers ? 'animate-spin' : ''} /></button>
                </div>
                {isLoadingUsers ? <p>Loading users...</p> : pendingUsers.length === 0 ? <p className="text-sm text-brand-text-secondary">No pending requests.</p> : (
                  <ul className="space-y-2">
                    {pendingUsers.map(u => (
                      <li key={u.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-2 bg-brand-surface rounded-md">
                        <div className="truncate mr-2"><p className="font-mono text-sm text-brand-text" title={u.email}>{u.email}</p><p className="text-xs text-brand-text-secondary">{u.createdAt ? new Date(u.createdAt.toDate()).toLocaleString() : 'Date unavailable'}</p></div>
                        <div className="flex gap-2 mt-2 sm:mt-0"><button onClick={() => handleUserApproval(u.id, 'approved')} className="p-2 bg-green-500/20 text-green-500 rounded-full hover:bg-green-500/30"><UserCheckIcon size={18} /></button><button onClick={() => handleUserApproval(u.id, 'denied')} className="p-2 bg-red-500/20 text-red-500 rounded-full hover:bg-red-500/30"><UserXIcon size={18} /></button></div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </section>
        );
      case 'danger':
        return (
          <section>
            <h3 className="text-xl font-bold text-red-500 mb-4">{t('settings.danger.title')}</h3>
            <div className="space-y-4 max-w-lg">
              <button onClick={() => { if(window.confirm(t('settings.danger.confirmReset'))) onResetProgress()}} className="w-full text-left p-3 bg-red-500/10 hover:bg-red-500/20 rounded-md transition-colors duration-200 b-border border-red-500/20">
                <p className="font-semibold text-red-500">{t('settings.danger.reset')}</p>
                <p className="text-sm text-red-500/80">{t('settings.danger.resetSub')}</p>
              </button>
              <button onClick={onOpenClearDataModal} className="w-full text-left p-3 bg-red-500/10 hover:bg-red-500/20 rounded-md transition-colors duration-200 b-border border-red-500/20">
                <p className="font-semibold text-red-500">{t('settings.danger.delete')}</p>
                <p className="text-sm text-red-500/80">{t('settings.danger.deleteSub')}</p>
              </button>
            </div>
          </section>
        );
      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 flex justify-center items-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-brand-surface w-full max-w-4xl h-[90vh] rounded-lg shadow-2xl b-border b-shadow flex flex-col md:flex-row overflow-hidden animate-scale-in"
        onClick={e => e.stopPropagation()}
      >
        <header className="flex-shrink-0 p-4 border-b border-brand-surface-light flex justify-between items-center md:hidden">
          <h2 className="text-xl font-bold text-brand-text">{t('settings.title')}</h2>
          <button onClick={onClose} className="text-brand-text-secondary hover:text-brand-text text-2xl leading-none">&times;</button>
        </header>
        
        {/* Sidebar */}
        <aside className="w-full md:w-56 flex-shrink-0 border-b md:border-b-0 md:border-r border-brand-surface-light bg-brand-surface-light/30">
            <div className="p-4 hidden md:block border-b border-brand-surface-light">
                <h2 className="text-xl font-bold text-brand-text">{t('settings.title')}</h2>
            </div>
            <nav className="p-2">
                <ul className="flex flex-row md:flex-col gap-1">
                    {categories.map(cat => (
                        <li key={cat.id} className="flex-1 md:flex-none">
                            <button
                                onClick={() => setActiveCategory(cat.id)}
                                className={`w-full flex items-center gap-3 p-3 text-sm font-semibold rounded-md text-left transition-colors ${activeCategory === cat.id ? 'bg-brand-primary/10 text-brand-primary' : 'text-brand-text hover:bg-brand-surface'}`}
                            >
                                <cat.icon size={20} className="flex-shrink-0" />
                                <span className="hidden md:inline">{cat.name}</span>
                            </button>
                        </li>
                    ))}
                </ul>
            </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 overflow-y-auto">
            {renderContent()}
        </main>
         <button onClick={onClose} className="absolute top-4 right-4 text-brand-text-secondary hover:text-brand-text text-2xl leading-none hidden md:block">&times;</button>
      </div>
    </div>
  );
};

export default SettingsModal;