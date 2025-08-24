'use client';

import React from 'react';
import { Save, Library, Clock, FileText, Eye } from 'lucide-react';
import { UserInfo } from './UserInfo';

interface HeaderProps {
  title?: string;
  onSave?: () => void;
  onOpenLibrary?: () => void;
  onTitleChange?: (newTitle: string) => void;
  isSaving?: boolean;
  hasUnsavedChanges?: boolean;
  lastSaved?: string;
  isEditableTitle?: boolean;
}

export function Header({ 
  title = "Component Editor", 
  onSave, 
  onOpenLibrary, 
  onTitleChange,
  isSaving, 
  hasUnsavedChanges,
  lastSaved,
  isEditableTitle = false
}: HeaderProps) {
  const [isEditingTitle, setIsEditingTitle] = React.useState(false);
  const [editedTitle, setEditedTitle] = React.useState(title);

  const handleTitleSave = () => {
    if (editedTitle.trim() && editedTitle !== title && onTitleChange) {
      onTitleChange(editedTitle.trim());
    }
    setIsEditingTitle(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTitleSave();
    } else if (e.key === 'Escape') {
      setEditedTitle(title);
      setIsEditingTitle(false);
    }
  };

  React.useEffect(() => {
    setEditedTitle(title);
  }, [title]);
  return (
    <header className="bg-white border-b border-gray-200 px-3 sm:px-6 py-3 sm:py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 sm:space-x-4 min-w-0 flex-1">
          <div className="flex items-center space-x-2 min-w-0 flex-1">
            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <FileText className="w-3 h-3 sm:w-5 sm:h-5 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              {isEditableTitle && isEditingTitle ? (
                <input
                  type="text"
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  onBlur={handleTitleSave}
                  onKeyDown={handleKeyDown}
                  className="text-lg sm:text-xl font-semibold text-gray-900 bg-transparent border-b border-blue-500 focus:outline-none focus:border-blue-600 w-full"
                  autoFocus
                />
              ) : (
                <h1 
                  className={`text-lg sm:text-xl font-semibold text-gray-900 truncate ${isEditableTitle ? 'cursor-pointer hover:text-blue-600 transition-colors' : ''}`}
                  onClick={() => isEditableTitle && setIsEditingTitle(true)}
                  title={isEditableTitle ? "Click to edit name" : title}
                >
                  {title}
                </h1>
              )}
              {lastSaved && (
                <p className="text-xs text-gray-500 truncate">
                  {hasUnsavedChanges ? 'Unsaved changes' : `Last saved ${formatRelativeTime(lastSaved)}`}
                </p>
              )}
              <UserInfo className="hidden sm:flex" />
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
          {lastSaved && (
            <div className="hidden sm:flex items-center space-x-1 text-sm text-gray-500">
              <div className={`w-2 h-2 rounded-full ${hasUnsavedChanges ? 'bg-yellow-400' : 'bg-green-400'}`} />
              <span>{hasUnsavedChanges ? 'Unsaved' : 'Saved'}</span>
            </div>
          )}

          {/* Mobile status indicator */}
          {lastSaved && (
            <div className="sm:hidden">
              <div className={`w-2 h-2 rounded-full ${hasUnsavedChanges ? 'bg-yellow-400' : 'bg-green-400'}`} />
            </div>
          )}

          <button
            onClick={onOpenLibrary}
            className="inline-flex items-center px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 shadow-sm text-xs sm:text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Eye className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Library</span>
          </button>

          <button
            onClick={onSave}
            disabled={isSaving || !hasUnsavedChanges}
            className="inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 border border-transparent text-xs sm:text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">{isSaving ? 'Saving...' : 'Save'}</span>
            <span className="sm:hidden">{isSaving ? '...' : 'Save'}</span>
          </button>
        </div>
      </div>
    </header>
  );
}

function formatRelativeTime(timestamp: string): string {
  const now = new Date();
  const then = new Date(timestamp);
  const diffInSeconds = Math.floor((now.getTime() - then.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'just now';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  }
}
