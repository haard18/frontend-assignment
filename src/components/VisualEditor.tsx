import React from 'react';
import { SerializedElement, EditorState } from '@/types';

interface VisualEditorProps {
  serializedComponent: SerializedElement;
  editorState: EditorState;
  onElementSelect: (element: SerializedElement, path: number[]) => void;
  onElementHover: (elementId: string | null) => void;
}

export function VisualEditor({
  serializedComponent,
  editorState,
  onElementSelect,
  onElementHover,
}: VisualEditorProps) {
  const renderElement = (element: SerializedElement | string, path: number[] = []): React.ReactNode => {
    if (typeof element === 'string') {
      return element;
    }

    const { type, props, children, id } = element;
    const isSelected = editorState.selectedElement?.id === id;
    const isHovered = editorState.hoveredElement === id;

    // Handle React Fragment
    if (type === 'Fragment') {
      return (
        <React.Fragment key={id}>
          {children.map((child, index) => 
            renderElement(child, [...path, index])
          )}
        </React.Fragment>
      );
    }

    // Create props for the rendered element
    const elementProps: Record<string, unknown> = { ...props };
    
    // Add selection and hover styles
    const additionalClasses = [];
    if (isSelected) {
      additionalClasses.push('ring-2 ring-blue-500 ring-inset bg-blue-50/50');
    }
    if (isHovered && !isSelected) {
      additionalClasses.push('ring-1 ring-blue-300 ring-inset bg-blue-50/30');
    }
    
    if (additionalClasses.length > 0) {
      elementProps.className = `${props.className || ''} ${additionalClasses.join(' ')}`.trim();
    }

    // Add interaction handlers
    elementProps.onClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      onElementSelect(element, path);
    };
    
    elementProps.onMouseEnter = (e: React.MouseEvent) => {
      e.stopPropagation();
      onElementHover(id);
    };
    
    elementProps.onMouseLeave = (e: React.MouseEvent) => {
      e.stopPropagation();
      onElementHover(null);
    };

    // Add cursor pointer to indicate clickable elements
    elementProps.style = {
      ...(elementProps.style as Record<string, unknown> || {}),
      cursor: 'pointer',
      position: 'relative',
    };

    // Render children
    const renderedChildren = children.map((child, index) => 
      renderElement(child, [...path, index])
    );

    // Create the element
    return React.createElement(
      type,
      { ...elementProps, key: id },
      ...renderedChildren
    );
  };

  return (
    <div className="h-full bg-white overflow-auto">
      <div className="p-8">
        <div className="max-w-5xl mx-auto">
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-xl p-8 min-h-[500px] shadow-sm">
            <div className="text-sm text-gray-600 mb-6 text-center font-medium">
              Click on any element below to edit its properties
            </div>
            <div
              className="bg-white rounded-lg shadow-sm border border-gray-100 p-6"
              onClick={(e) => {
                e.stopPropagation();
                if (editorState.selectedElement) {
                  onElementSelect(serializedComponent, []);
                }
              }}
            >
              {renderElement(serializedComponent)}
            </div>
          </div>
        </div>
      </div>
      
      {/* Element info overlay */}
      {editorState.selectedElement && (
        <div className="fixed top-6 right-6 bg-white border border-gray-200 text-gray-800 px-4 py-2 rounded-lg text-sm shadow-lg z-50">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span className="font-medium">Selected:</span>
            <span className="text-blue-600 font-semibold">{editorState.selectedElement.element.type}</span>
          </div>
        </div>
      )}
    </div>
  );
}
