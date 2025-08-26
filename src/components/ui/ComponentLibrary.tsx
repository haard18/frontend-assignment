'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Plus, Trash2, Eye, Edit3, Calendar, Clock, User, Download, Upload, Database } from 'lucide-react';
import { ComponentData } from '@/types';
import { useComponentAPI } from '@/hooks/useComponentAPI';
import { getCurrentUserId, isMyComponent } from '@/lib/userUtils';

interface ComponentLibraryProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectComponent: (component: ComponentData) => void;
  onCreateNew: () => void;
}

interface StorageInfo {
  count: number;
  lastSync: string | null;
  storageSize: number;
}

export function ComponentLibrary({ isOpen, onClose, onSelectComponent, onCreateNew }: ComponentLibraryProps) {
  const [components, setComponents] = useState<ComponentData[]>([]);
  const [loading, setLoading] = useState(false);
  const [storageInfo, setStorageInfo] = useState<StorageInfo | null>(null);
  const [showStorageInfo, setShowStorageInfo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { loadComponent, updateComponent, loadMyComponents } = useComponentAPI();

  useEffect(() => {
    if (isOpen) {
      loadComponents();
      loadStorageInfo();
    }
  }, [isOpen]);

  const loadComponents = async () => {
    setLoading(true);
    try {
      const myComponents = await loadMyComponents();
      setComponents(myComponents);
    } catch (error) {
      console.error('Failed to load components:', error);
      setComponents([]);
    } finally {
      setLoading(false);
    }
  };

  const loadStorageInfo = async () => {
    try {
      const response = await fetch('/api/component?info=true');
      if (response.ok) {
        const info = await response.json();
        setStorageInfo(info);
      }
    } catch (error) {
      console.error('Failed to load storage info:', error);
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(components, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `components-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const jsonData = e.target?.result as string;
        const importedComponents = JSON.parse(jsonData);
        
        if (!Array.isArray(importedComponents)) {
          alert('Invalid file format. Please select a valid components export file.');
          return;
        }

        let importCount = 0;
        for (const component of importedComponents) {
          if (component.serializedComponent && component.code) {
            try {
              const response = await fetch('/api/component', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  ...component,
                  id: undefined, // Let the API generate new IDs
                  userId: getCurrentUserId(),
                  importedAt: new Date().toISOString(),
                }),
              });
              
              if (response.ok) {
                importCount++;
              }
            } catch (error) {
              console.error('Failed to import component:', component.name, error);
            }
          }
        }
        
        alert(`Successfully imported ${importCount} component(s).`);
        loadComponents(); // Refresh the list
        loadStorageInfo(); // Refresh storage info
      } catch (error) {
        console.error('Import error:', error);
        alert('Failed to import components. Please check the file format.');
      }
    };
    
    reader.readAsText(file);
    // Reset the input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this component?')) return;
    
    try {
      const response = await fetch(`/api/component/${id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setComponents(prev => prev.filter(c => c.id !== id));
        loadStorageInfo(); // Refresh storage info
      }
    } catch (error) {
      console.error('Failed to delete component:', error);
    }
  };

  const handleUpdate = async (id: string, updates: Partial<ComponentData>) => {
    try {
      const response = await fetch(`/api/component/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });
      
      if (response.ok) {
        const updatedComponent = await response.json();
        setComponents(prev => prev.map(c => c.id === id ? updatedComponent : c));
        loadStorageInfo(); // Refresh storage info
      }
    } catch (error) {
      console.error('Failed to update component:', error);
    }
  };

  const handleCreateNew = () => {
    onCreateNew();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-2 sm:p-4">
        <div className="fixed inset-0 bg-black bg-opacity-25 transition-opacity" onClick={onClose} />
        
        <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] sm:max-h-[80vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-3 sm:p-6 border-b border-gray-200">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900">My Components</h2>
                {storageInfo && (
                  <button
                    onClick={() => setShowStorageInfo(!showStorageInfo)}
                    className="inline-flex items-center px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-xs font-medium text-gray-600 transition-colors"
                  >
                    <Database className="w-3 h-3 mr-1" />
                    {storageInfo.count}
                  </button>
                )}
              </div>
              <p className="text-xs sm:text-sm text-gray-500 mt-1 truncate">Your personal component library with persistent storage</p>
              
              {/* Storage Info */}
              {showStorageInfo && storageInfo && (
                <div className="mt-2 p-2 bg-blue-50 rounded-md">
                  <div className="text-xs text-gray-600 space-y-1">
                    <div>Components: {storageInfo.count}</div>
                    <div>Storage size: {formatBytes(storageInfo.storageSize)}</div>
                    {storageInfo.lastSync && (
                      <div>Last sync: {formatDate(storageInfo.lastSync)}</div>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
              {/* Import/Export buttons */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-1.5 sm:p-2 text-gray-400 hover:text-green-600 focus:outline-none"
                title="Import components"
              >
                <Upload className="w-4 h-4" />
              </button>
              <button
                onClick={handleExport}
                className="p-1.5 sm:p-2 text-gray-400 hover:text-blue-600 focus:outline-none"
                title="Export components"
                disabled={components.length === 0}
              >
                <Download className="w-4 h-4" />
              </button>
              <button
                onClick={handleCreateNew}
                className="inline-flex items-center px-2 sm:px-4 py-1.5 sm:py-2 border border-transparent text-xs sm:text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Plus className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
                <span className="hidden sm:inline">New Component</span>
                <span className="sm:hidden">New</span>
              </button>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-3 sm:p-6 overflow-y-auto max-h-[75vh] sm:max-h-[60vh]">
            {loading ? (
              <div className="flex items-center justify-center py-8 sm:py-12">
                <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-sm sm:text-base text-gray-600">Loading components...</span>
              </div>
            ) : components.length === 0 ? (
              <div className="text-center py-8 sm:py-12">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Edit3 className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
                </div>
                <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No components yet</h3>
                <p className="text-sm text-gray-500 mb-6">Create your first component or import existing ones</p>
                <div className="flex flex-col sm:flex-row gap-2 justify-center">
                  <button
                    onClick={handleCreateNew}
                    className="inline-flex items-center px-3 sm:px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Component
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center px-3 sm:px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Import Components
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {components.map((component) => (
                  <ComponentCard
                    key={component.id}
                    component={component}
                    onSelect={() => onSelectComponent(component)}
                    onDelete={() => handleDelete(component.id!)}
                    onUpdate={(updates) => handleUpdate(component.id!, updates)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface ComponentCardProps {
  component: ComponentData;
  onSelect: () => void;
  onDelete: () => void;
  onUpdate: (updates: Partial<ComponentData>) => void;
}

function ComponentCard({ component, onSelect, onDelete, onUpdate }: ComponentCardProps) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(component.name || 'Untitled Component');
  const isOwner = isMyComponent(component.userId);

  const handleNameSave = async () => {
    if (editedName.trim() && editedName !== component.name) {
      onUpdate({ name: editedName.trim() });
    }
    setIsEditingName(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleNameSave();
    } else if (e.key === 'Escape') {
      setEditedName(component.name || 'Untitled Component');
      setIsEditingName(false);
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow bg-white">
      <div className="flex items-start justify-between mb-2 sm:mb-3">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {isEditingName ? (
            <input
              type="text"
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              onBlur={handleNameSave}
              onKeyDown={handleKeyDown}
              className="font-medium text-gray-900 bg-transparent border-b border-blue-500 focus:outline-none focus:border-blue-600 flex-1 mr-2 text-sm sm:text-base"
              autoFocus
            />
          ) : (
            <>
              <h3 
                className="font-medium text-gray-900 truncate cursor-pointer hover:text-blue-600 transition-colors text-sm sm:text-base"
                onClick={() => setIsEditingName(true)}
                title="Click to edit name"
              >
                {component.name || 'Untitled Component'}
              </h3>
              {isOwner && (
                <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" title="Your component" />
              )}
            </>
          )}
        </div>
        <div className="flex items-center space-x-1 ml-2 flex-shrink-0">
          <button
            onClick={onSelect}
            className="p-0.5 sm:p-1 text-gray-400 hover:text-blue-600 focus:outline-none"
            title="Open component"
          >
            <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
          </button>
          <button
            onClick={() => setIsEditingName(true)}
            className="p-0.5 sm:p-1 text-gray-400 hover:text-green-600 focus:outline-none"
            title="Edit name"
          >
            <Edit3 className="w-3 h-3 sm:w-4 sm:h-4" />
          </button>
          <button
            onClick={onDelete}
            className="p-0.5 sm:p-1 text-gray-400 hover:text-red-600 focus:outline-none"
            title="Delete component"
          >
            <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
          </button>
        </div>
      </div>
      
      <div className="bg-gray-50 rounded border p-2 sm:p-3 mb-2 sm:mb-3 max-h-24 sm:max-h-32 overflow-hidden">
        <pre className="text-xs text-gray-600 font-mono overflow-hidden">
          {component.code?.slice(0, 120)}
          {(component.code?.length || 0) > 120 && '...'}
        </pre>
      </div>
      
      <div className="text-xs text-gray-500 space-y-1">
        {component.createdAt && (
          <div className="flex items-center">
            <Calendar className="w-3 h-3 mr-1 flex-shrink-0" />
            <span className="truncate">Created {formatDate(component.createdAt)}</span>
          </div>
        )}
        {component.updatedAt && (
          <div className="flex items-center">
            <Clock className="w-3 h-3 mr-1 flex-shrink-0" />
            <span className="truncate">Updated {formatDate(component.updatedAt)}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function formatDate(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
