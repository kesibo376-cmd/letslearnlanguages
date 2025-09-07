
import React, { useState, useEffect, useRef } from 'react';
import FileUpload from './FileUpload';
import SettingsIcon from './icons/SettingsIcon';
import EditIcon from './icons/EditIcon';
import { useTranslation } from '../contexts/LanguageContext';

interface HeaderProps {
  title: string;
  onSetTitle: (title: string) => void;
  onFileUpload: (files: FileList) => void;
  onOpenSettings: () => void;
  isLoading: boolean;
}

const Header: React.FC<HeaderProps> = ({ title, onSetTitle, onFileUpload, onOpenSettings, isLoading }) => {
  const [isEditing, setIsEditing] = useState(false);
  const displayTitle = title === 'My Audio Library' ? "Bokesi's App" : title;
  const [inputValue, setInputValue] = useState(displayTitle);
  const inputRef = useRef<HTMLInputElement>(null);
  const { t } = useTranslation();

  useEffect(() => {
    // Keep input value in sync with the displayed title, unless the user is actively editing it.
    if (!isEditing) {
        setInputValue(displayTitle);
    }
  }, [displayTitle, isEditing]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleBlur = () => {
    setIsEditing(false);
    const trimmedValue = inputValue.trim();
    
    // Only update if the new value is non-empty and different from the original title.
    // This also handles the "soft migration" of the old default title to the new one.
    if (trimmedValue && trimmedValue !== title) {
      onSetTitle(trimmedValue);
    } else {
      // If no change or input is empty, revert to the currently displayed title.
      setInputValue(displayTitle);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleBlur();
    } else if (e.key === 'Escape') {
      setInputValue(displayTitle);
      setIsEditing(false);
    }
  };

  return (
    <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
      <div className="flex-grow flex items-center gap-2 group w-full">
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className="text-3xl font-bold bg-transparent border-b-2 border-brand-primary focus:outline-none text-brand-text w-full"
          />
        ) : (
          <h1 className="text-3xl font-bold text-brand-text cursor-pointer truncate" onClick={() => setIsEditing(true)}>
            {displayTitle}
          </h1>
        )}
        <button onClick={() => setIsEditing(true)} className="text-brand-text-secondary hover:text-brand-text p-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
            <EditIcon size={20} />
        </button>
      </div>
      <div className="flex-shrink-0 flex items-center gap-2 self-end sm:self-center">
        <FileUpload onFileUpload={onFileUpload} isLoading={isLoading} />
        <button onClick={onOpenSettings} className="group p-3 rounded-full hover:bg-brand-surface transition-colors" aria-label="Open settings">
          <SettingsIcon size={24} className="text-brand-text-secondary group-hover:text-brand-text" />
        </button>
      </div>
    </header>
  );
};

export default Header;
