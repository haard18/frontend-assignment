'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { ComponentData } from '@/types';
import { parseReactComponent } from '@/lib/componentUtils';
import { useToast } from '@/components/ui/Toast';
import { ArrowLeft, Code, Copy, Edit, Calendar } from 'lucide-react';
import Link from 'next/link';

function ComponentRenderer({ serializedComponent }: { serializedComponent: any }) {
  const renderElement = (element: any): React.ReactNode => {
    if (typeof element === 'string') {
      return element;
    }

    const { type, props, children, id } = element;

    // Handle React Fragment
    if (type === 'Fragment') {
      return (
        <React.Fragment key={id}>
          {children.map((child: any, index: number) => 
            renderElement(child)
          )}
        </React.Fragment>
      );
    }

    // Render children
    const renderedChildren = children.map((child: any, index: number) => 
      renderElement(child)
    );

    // Create the element
    return React.createElement(
      type,
      { ...props, key: id },
      ...renderedChildren
    );
  };

  return <>{renderElement(serializedComponent)}</>;
}

export default function PreviewPage() {
  const params = useParams();
  const id = params.id as string;
  const [component, setComponent] = useState<ComponentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    if (id) {
      fetchComponent(id);
    }
  }, [id]);

  const fetchComponent = async (componentId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/component/${componentId}`);
      
      if (response.ok) {
        const data = await response.json();
        setComponent(data);
      } else {
        setError('Component not found');
      }
    } catch (error) {
      console.error('Error fetching component:', error);
      setError('Failed to load component');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = async () => {
    if (!component?.code) return;
    
    try {
      await navigator.clipboard.writeText(component.code);
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
          <p className="text-gray-600">Loading component...</p>
        </div>
      </div>
    );
  }

  if (error || !component) {
    return (
      <div className="h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Code className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Component Not Found</h2>
          <p className="text-gray-600 mb-6">
            {error || 'The component you\'re looking for doesn\'t exist or has been removed.'}
          </p>
          <Link
            href="/components"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Components
          </Link>
        </div>
      </div>
    );
  }

  let parsedComponent;
  try {
    parsedComponent = parseReactComponent(component.code);
  } catch (parseError) {
    console.error('Parse error:', parseError);
  }

  return (
    <div className="h-[calc(100vh-4rem)] overflow-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link
              href="/components"
              className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Components
            </Link>
          </div>
          
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {component.name || 'Untitled Component'}
              </h1>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  Created: {formatDate(component.createdAt || new Date().toISOString())}
                </div>
                {component.updatedAt && (
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Updated: {formatDate(component.updatedAt)}
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={handleCopyCode}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <Copy className="w-4 h-4" />
                Copy Code
              </button>
              <Link
                href={`/?edit=${component.id}`}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Edit className="w-4 h-4" />
                Edit Component
              </Link>
            </div>
          </div>
        </div>

        {/* Component Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Live Preview */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">Live Preview</h2>
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
              <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                <span className="text-sm font-medium text-gray-600">Preview</span>
              </div>
              <div className="p-8">
                {parsedComponent ? (
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-lg p-6">
                    <ComponentRenderer serializedComponent={parsedComponent} />
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Code className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p>Unable to render component preview</p>
                    <p className="text-sm mt-2">There may be a syntax error in the component code</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Code View */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">Source Code</h2>
            <div className="bg-gray-900 border border-gray-200 rounded-xl shadow-sm overflow-hidden">
              <div className="bg-gray-800 px-4 py-2 border-b border-gray-700">
                <span className="text-sm font-medium text-gray-300">JSX Code</span>
              </div>
              <div className="p-4 overflow-auto max-h-96">
                <pre className="text-sm text-gray-100 font-mono leading-relaxed">
                  <code>{component.code}</code>
                </pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
