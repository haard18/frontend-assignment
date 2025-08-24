'use client';

import React, { useState, useEffect } from 'react';
import { useComponentAPI } from '@/hooks/useComponentAPI';
import { ComponentData } from '@/types';
import { useToast } from '@/components/ui/Toast';
import { Trash2, Eye, Edit, Copy, Calendar, Code } from 'lucide-react';
import Link from 'next/link';

export default function ComponentsPage() {
  const [components, setComponents] = useState<ComponentData[]>([]);
  const [loading, setLoading] = useState(true);
  const { deleteComponent } = useComponentAPI();
  const { showToast } = useToast();

  useEffect(() => {
    fetchComponents();
  }, []);

  const fetchComponents = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/component');
      if (response.ok) {
        const data = await response.json();
        setComponents(data.components || []);
      } else {
        showToast({ type: 'error', title: 'Failed to fetch components' });
      }
    } catch (error) {
      console.error('Error fetching components:', error);
      showToast({ type: 'error', title: 'Error loading components' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this component?')) {
      return;
    }

    try {
      await deleteComponent(id);
      setComponents(prev => prev.filter(comp => comp.id !== id));
      showToast({ type: 'success', title: 'Component deleted successfully' });
    } catch (error) {
      console.error('Error deleting component:', error);
      showToast({ type: 'error', title: 'Failed to delete component' });
    }
  };

  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      showToast({ type: 'success', title: 'Code copied to clipboard' });
    } catch (error) {
      console.error('Error copying code:', error);
      showToast({ type: 'error', title: 'Failed to copy code' });
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading components...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] overflow-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Saved Components</h1>
              <p className="text-gray-600 mt-2">
                Manage and browse your saved React components
              </p>
            </div>
            <Link
              href="/?new=true"
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-all duration-200 shadow-sm"
            >
              <Code className="w-4 h-4" />
              Create New Component
            </Link>
          </div>
        </div>

        {/* Components Grid */}
        {components.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Code className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">No components yet</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Start creating your first React component to see it here. Use the editor to build and save components.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-all duration-200"
            >
              <Code className="w-5 h-5" />
              Get Started
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {components.map((component) => (
              <div
                key={component.id}
                className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200"
              >
                {/* Component Preview */}
                <div className="p-6 border-b border-gray-100">
                  <div className="h-32 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg flex items-center justify-center border border-gray-200">
                    <div className="text-center">
                      <Code className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">Component Preview</p>
                    </div>
                  </div>
                </div>

                {/* Component Info */}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-gray-900 truncate">
                        {component.name || 'Untitled Component'}
                      </h3>
                      <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                        <Calendar className="w-4 h-4" />
                        {formatDate(component.updatedAt || component.createdAt || new Date().toISOString())}
                      </div>
                    </div>
                  </div>

                  {/* Code Preview */}
                  <div className="bg-gray-50 rounded-lg p-3 mb-4">
                    <pre className="text-xs text-gray-700 overflow-hidden">
                      <code className="line-clamp-3">
                        {component.code.substring(0, 100)}
                        {component.code.length > 100 && '...'}
                      </code>
                    </pre>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/preview/${component.id}`}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      Preview
                    </Link>
                    <Link
                      href={`/?edit=${component.id}`}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                      Edit
                    </Link>
                    <button
                      onClick={() => handleCopyCode(component.code)}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <Copy className="w-4 h-4" />
                      Copy
                    </button>
                    <button
                      onClick={() => component.id && handleDelete(component.id)}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors ml-auto"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
