'use client';

import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Eye, Edit3, Calendar, Clock } from 'lucide-react';
import { ComponentData } from '@/types';
import { useComponentAPI } from '@/hooks/useComponentAPI';

interface ComponentLibraryProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectComponent: (component: ComponentData) => void;
  onCreateNew: () => void;
}

export function ComponentLibrary({ isOpen, onClose, onSelectComponent, onCreateNew }: ComponentLibraryProps) {
  const [components, setComponents] = useState<ComponentData[]>([]);
  const [loading, setLoading] = useState(false);
  const { loadComponent, updateComponent } = useComponentAPI();

  useEffect(() => {
    if (isOpen) {
      loadComponents();
    }
  }, [isOpen]);

  const loadComponents = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/component');
      if (response.ok) {
        const data = await response.json();
        // Handle the response structure from the API
        setComponents(Array.isArray(data) ? data : data.components || []);
      } else {
        console.error('Failed to load components');
        setComponents([]);
      }
    } catch (error) {
      console.error('Failed to load components:', error);
      setComponents([]);
    } finally {
      setLoading(false);
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
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-25 transition-opacity" onClick={onClose} />
        
        <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[80vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Component Library</h2>
              <p className="text-sm text-gray-500 mt-1">Manage your saved components</p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleCreateNew}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Component
              </button>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[60vh]">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">Loading components...</span>
              </div>
            ) : components.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Edit3 className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No components yet</h3>
                <p className="text-gray-500 mb-6">Create your first component to get started</p>
                <button
                  onClick={handleCreateNew}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Component
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-white">
      <div className="flex items-start justify-between mb-3">
        {isEditingName ? (
          <input
            type="text"
            value={editedName}
            onChange={(e) => setEditedName(e.target.value)}
            onBlur={handleNameSave}
            onKeyDown={handleKeyDown}
            className="font-medium text-gray-900 bg-transparent border-b border-blue-500 focus:outline-none focus:border-blue-600 flex-1 mr-2"
            autoFocus
          />
        ) : (
          <h3 
            className="font-medium text-gray-900 truncate cursor-pointer hover:text-blue-600 transition-colors"
            onClick={() => setIsEditingName(true)}
            title="Click to edit name"
          >
            {component.name || 'Untitled Component'}
          </h3>
        )}
        <div className="flex items-center space-x-1 ml-2">
          <button
            onClick={onSelect}
            className="p-1 text-gray-400 hover:text-blue-600 focus:outline-none"
            title="Open component"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsEditingName(true)}
            className="p-1 text-gray-400 hover:text-green-600 focus:outline-none"
            title="Edit name"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            className="p-1 text-gray-400 hover:text-red-600 focus:outline-none"
            title="Delete component"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      <div className="bg-gray-50 rounded border p-3 mb-3 max-h-32 overflow-hidden">
        <pre className="text-xs text-gray-600 font-mono overflow-hidden">
          {component.code?.slice(0, 150)}
          {(component.code?.length || 0) > 150 && '...'}
        </pre>
      </div>
      
      <div className="text-xs text-gray-500 space-y-1">
        {component.createdAt && (
          <div className="flex items-center">
            <Calendar className="w-3 h-3 mr-1" />
            Created {formatDate(component.createdAt)}
          </div>
        )}
        {component.updatedAt && (
          <div className="flex items-center">
            <Clock className="w-3 h-3 mr-1" />
            Updated {formatDate(component.updatedAt)}
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
