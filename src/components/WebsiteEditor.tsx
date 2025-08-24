'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { SerializedElement, ComponentData, EditorState, SelectedElement, EditableProperty } from '@/types';
import { parseReactComponent, serializeToCode, updateElementInTree, findElementById } from '@/lib/componentUtils';
import { CodeEditor } from './CodeEditor';
import { VisualEditor } from './VisualEditor';
import { PropertyPanel } from './PropertyPanel';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/Tabs';
import { Header } from './ui/Header';
import { ComponentLibrary } from './ui/ComponentLibrary';
import { useToast } from './ui/Toast';
import { useComponentAPI } from '@/hooks/useComponentAPI';

interface WebsiteEditorProps {
  component?: React.ReactNode;
  onSave?: (serializedComponent: ComponentData) => void;
  initialData?: ComponentData;
}

export function WebsiteEditor({ component, onSave, initialData }: WebsiteEditorProps) {
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');
  const isNew = searchParams.get('new') === 'true';
  
  const [componentData, setComponentData] = useState<ComponentData | null>(initialData || null);
  const [code, setCode] = useState(initialData?.code || '');
  const [parseError, setParseError] = useState<string | null>(null);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editorState, setEditorState] = useState<EditorState>({
    selectedElement: null,
    isEditing: false,
    hoveredElement: null,
  });
  const [activeTab, setActiveTab] = useState<'visual' | 'code'>('visual');
  const { showToast } = useToast();
  const { loadComponent, saveComponent, updateComponent } = useComponentAPI();

  // Load component if editing existing one
  useEffect(() => {
    if (editId) {
      loadExistingComponent(editId);
    } else if (isNew) {
      resetToDefault();
    }
  }, [editId, isNew]);

  const loadExistingComponent = async (id: string) => {
    try {
      setIsLoading(true);
      const component = await loadComponent(id);
      if (component) {
        setComponentData(component);
        setCode(component.code);
        setHasUnsavedChanges(false);
        showToast({ type: 'success', title: 'Component loaded successfully' });
      } else {
        showToast({ type: 'error', title: 'Component not found' });
        resetToDefault();
      }
    } catch (error) {
      console.error('Error loading component:', error);
      showToast({ type: 'error', title: 'Failed to load component' });
      resetToDefault();
    } finally {
      setIsLoading(false);
    }
  };

  const resetToDefault = () => {
    setComponentData(null);
    setCode('');
    setHasUnsavedChanges(false);
    setEditorState({
      selectedElement: null,
      isEditing: false,
      hoveredElement: null,
    });
  };

  // Parse initial component code
  useEffect(() => {
    if (!componentData && !initialData) {
      // Create a professional welcome component
      const defaultCode = `<div className="max-w-2xl mx-auto p-8 bg-white rounded-xl shadow-sm border border-gray-200">
  <div className="text-center">
    <h1 className="text-3xl font-bold text-gray-900 mb-4">Welcome to Component Editor</h1>
    <p className="text-lg text-gray-600 mb-6">Create and edit React components with a visual interface</p>
    <div className="flex justify-center space-x-4">
      <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
        Get Started
      </button>
      <button className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium">
        Learn More
      </button>
    </div>
  </div>
</div>`;
      setCode(defaultCode);
      handleParseComponent(defaultCode);
    }
  }, [componentData, initialData]);

  const handleTitleChange = useCallback((newTitle: string) => {
    if (componentData) {
      const updatedData = { ...componentData, name: newTitle };
      setComponentData(updatedData);
      setHasUnsavedChanges(true);
    }
  }, [componentData]);

  const handleParseComponent = useCallback((codeInput: string) => {
    try {
      setParseError(null);
      const parsed = parseReactComponent(codeInput);
      if (parsed) {
        const newComponentData: ComponentData = {
          name: 'Untitled Component',
          code: codeInput,
          serializedComponent: parsed,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setComponentData(newComponentData);
        setCode(codeInput);
        setHasUnsavedChanges(true);
      } else {
        setParseError('Failed to parse component. Please check your JSX syntax.');
        showToast({
          type: 'error',
          title: 'Parse Error',
          message: 'Failed to parse JSX. Check your syntax and try again.'
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown parsing error';
      setParseError(errorMessage);
      showToast({
        type: 'error',
        title: 'Parse Error',
        message: errorMessage
      });
      console.error('Parse error:', error);
    }
  }, [showToast]);

  const handleElementSelect = useCallback((element: SerializedElement, path: number[]) => {
    const properties = getEditableProperties(element);
    setEditorState(prev => ({
      ...prev,
      selectedElement: {
        id: element.id,
        element,
        path,
        properties,
      },
      isEditing: true,
    }));
  }, []);

    const handlePropertyChange = useCallback((propertyKey: string, value: any) => {
    if (!componentData || !editorState.selectedElement) return;

    try {
      // Create the updates object based on the property key
      let updates: Partial<SerializedElement>;
      if (propertyKey.startsWith('style.')) {
        const styleKey = propertyKey.replace('style.', '');
        updates = {
          props: {
            ...editorState.selectedElement.element.props,
            style: {
              ...(editorState.selectedElement.element.props.style as Record<string, any> || {}),
              [styleKey]: value
            }
          }
        };
      } else if (propertyKey === 'textContent') {
        updates = {
          children: [value]
        };
      } else {
        updates = {
          props: {
            ...editorState.selectedElement.element.props,
            [propertyKey]: value
          }
        };
      }

      const updatedTree = updateElementInTree(
        componentData.serializedComponent,
        editorState.selectedElement.element.id,
        updates
      );

      if (updatedTree) {
        const serializedCode = serializeToCode(updatedTree);
        const updatedComponentData = {
          ...componentData,
          serializedComponent: updatedTree,
          code: serializedCode,
          updatedAt: new Date().toISOString(),
        };
        
        setComponentData(updatedComponentData);
        setCode(serializedCode);
        setHasUnsavedChanges(true);

        // Update the selected element to reflect the new state
        const updatedElement = findElementById(updatedTree, editorState.selectedElement.element.id);
        if (updatedElement && editorState.selectedElement) {
          const properties = getEditableProperties(updatedElement);
          setEditorState(prev => ({
            ...prev,
            selectedElement: {
              id: updatedElement.id,
              element: updatedElement,
              path: prev.selectedElement!.path,
              properties,
            },
          }));
        }
      }
    } catch (error) {
      console.error('Error updating property:', error);
      setParseError(error instanceof Error ? error.message : 'Error updating property');
    }
  }, [componentData, editorState.selectedElement]);

  const handleSave = async (dataToSave?: ComponentData) => {
    const saveData = dataToSave || componentData;
    if (!saveData) return;

    setIsSaving(true);
    try {
      let savedComponent;
      
      if (saveData.id) {
        // Update existing component
        savedComponent = await updateComponent(saveData.id, {
          ...saveData,
          updatedAt: new Date().toISOString(),
        });
      } else {
        // Save new component
        savedComponent = await saveComponent({
          ...saveData,
          id: undefined, // Let the API generate the ID
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }

      if (savedComponent) {
        setComponentData(savedComponent);
        setHasUnsavedChanges(false);
        showToast({ 
          type: 'success', 
          title: saveData.id ? 'Component updated successfully' : 'Component saved successfully' 
        });
      } else {
        throw new Error('Failed to save component');
      }
    } catch (error) {
      console.error('Error saving component:', error);
      showToast({ 
        type: 'error', 
        title: 'Failed to save component',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCodeChange = useCallback((newCode: string) => {
    setCode(newCode);
    setParseError(null);
    setHasUnsavedChanges(true);
    
    // Parse and update component data without auto-saving
    try {
      const parsed = parseReactComponent(newCode);
      if (parsed) {
        const updatedComponentData = {
          ...componentData,
          serializedComponent: parsed,
          code: newCode,
          id: componentData?.id,
          name: componentData?.name || 'Untitled Component',
          createdAt: componentData?.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setComponentData(updatedComponentData);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Parse error';
      setParseError(errorMessage);
    }
  }, [componentData]);

  const handleElementHover = useCallback((elementId: string | null) => {
    setEditorState(prev => ({
      ...prev,
      hoveredElement: elementId,
    }));
  }, []);

  const getEditableProperties = (element: SerializedElement): EditableProperty[] => {
    const properties: EditableProperty[] = [];
    
    // Add common editable properties
    Object.entries(element.props).forEach(([key, value]) => {
      if (key === 'className') {
        properties.push({
          key,
          value,
          type: 'text',
        });
      } else if (key === 'style') {
        // Handle inline styles
        if (typeof value === 'object' && value !== null) {
          Object.entries(value).forEach(([styleKey, styleValue]) => {
            if (styleKey.includes('color')) {
              properties.push({
                key: `style.${styleKey}`,
                value: styleValue,
                type: 'color',
              });
            } else if (typeof styleValue === 'number' || (typeof styleValue === 'string' && styleValue.match(/^\d+/))) {
              properties.push({
                key: `style.${styleKey}`,
                value: styleValue,
                type: 'number',
              });
            } else {
              properties.push({
                key: `style.${styleKey}`,
                value: styleValue,
                type: 'text',
              });
            }
          });
        }
      } else if (typeof value === 'string') {
        properties.push({
          key,
          value,
          type: 'text',
        });
      } else if (typeof value === 'number') {
        properties.push({
          key,
          value,
          type: 'number',
        });
      } else if (typeof value === 'boolean') {
        properties.push({
          key,
          value,
          type: 'boolean',
        });
      }
    });

    // Add text content if element has text children
    const textChild = element.children.find(child => typeof child === 'string');
    if (textChild) {
      properties.push({
        key: 'textContent',
        value: textChild,
        type: 'text',
      });
    }

    return properties;
  };

  if (isLoading) {
    return (
      <div className="h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading component...</p>
        </div>
      </div>
    );
  }

  const handleLoadComponent = (component: ComponentData) => {
    setComponentData(component);
    setCode(component.code);
    setHasUnsavedChanges(false);
    setEditorState({
      selectedElement: null,
      isEditing: false,
      hoveredElement: null,
    });
    setIsLibraryOpen(false);
    showToast({ type: 'success', title: 'Component loaded successfully' });
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-white">
      <Header
        title={componentData?.name || 'Untitled Component'}
        isSaving={isSaving}
        hasUnsavedChanges={hasUnsavedChanges}
        onSave={async () => {
          if (componentData) {
            await handleSave(componentData);
          }
        }}
        onOpenLibrary={() => setIsLibraryOpen(true)}
        onTitleChange={handleTitleChange}
        lastSaved={componentData?.updatedAt}
        isEditableTitle={true}
      />

      {parseError && (
        <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600 text-sm">
            <strong>Parse Error:</strong> {parseError}
          </p>
          <p className="text-red-500 text-xs mt-1">
            Tip: Make sure adjacent JSX elements are wrapped in a fragment &lt;&gt;...&lt;/&gt; or a container element.
          </p>
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col">
          <Tabs 
            value={activeTab} 
            onValueChange={(value) => setActiveTab(value as 'visual' | 'code')}
            className="h-full flex flex-col"
          >
            <div className="bg-gray-50 border-b border-gray-200 px-6 py-3">
              <TabsList>
                <TabsTrigger value="visual">Visual Editor</TabsTrigger>
                <TabsTrigger value="code">Code Editor</TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="visual" className="flex-1 overflow-hidden">
              {componentData ? (
                <VisualEditor
                  serializedComponent={componentData.serializedComponent}
                  editorState={editorState}
                  onElementSelect={handleElementSelect}
                  onElementHover={handleElementHover}
                />
              ) : (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center max-w-md">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Component Loaded</h3>
                    <p className="text-gray-600 mb-4">
                      Paste your JSX code in the code editor or start with a template.
                    </p>
                    <button
                      onClick={() => setActiveTab('code')}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Open Code Editor
                    </button>
                  </div>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="code" className="flex-1 overflow-hidden">
              <CodeEditor
                code={code}
                onChange={handleCodeChange}
                onParse={handleParseComponent}
              />
            </TabsContent>
          </Tabs>
        </div>

        {editorState.selectedElement && (
          <PropertyPanel
            selectedElement={editorState.selectedElement}
            onPropertyChange={handlePropertyChange}
          />
        )}
      </div>

      {isLibraryOpen && (
        <ComponentLibrary
          isOpen={isLibraryOpen}
          onClose={() => setIsLibraryOpen(false)}
          onSelectComponent={handleLoadComponent}
          onCreateNew={() => {
            resetToDefault();
            setIsLibraryOpen(false);
          }}
        />
      )}
    </div>
  );
}
