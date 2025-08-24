import React from 'react';
import { SelectedElement, EditableProperty } from '@/types';

interface PropertyPanelProps {
  selectedElement: SelectedElement;
  onPropertyChange: (propertyKey: string, value: any) => void;
}

export function PropertyPanel({ selectedElement, onPropertyChange }: PropertyPanelProps) {
  const { element, properties } = selectedElement;

  const renderPropertyInput = (property: EditableProperty) => {
    const { key, value, type, options } = property;

    switch (type) {
      case 'text':
        return (
          <input
            type="text"
            value={String(value ?? '')}
            onChange={(e) => onPropertyChange(key, e.target.value)}
            className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
          />
        );
      
      case 'color':
        return (
          <div className="flex gap-2 sm:gap-3">
            <input
              type="color"
              value={typeof value === 'string' ? value : '#000000'}
              onChange={(e) => onPropertyChange(key, e.target.value)}
              className="w-10 h-9 sm:w-12 sm:h-11 border border-gray-200 rounded-lg cursor-pointer"
            />
            <input
              type="text"
              value={typeof value === 'string' ? value : ''}
              onChange={(e) => onPropertyChange(key, e.target.value)}
              className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
              placeholder="#000000"
            />
          </div>
        );
      
      case 'number':
        return (
          <input
            type="number"
            value={typeof value === 'number' ? value : 0}
            onChange={(e) => onPropertyChange(key, parseFloat(e.target.value) || 0)}
            className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
          />
        );
      
      case 'boolean':
        return (
          <label className="flex items-center gap-2 sm:gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={typeof value === 'boolean' ? value : false}
              onChange={(e) => onPropertyChange(key, e.target.checked)}
              className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 transition-all"
            />
            <span className="text-xs sm:text-sm font-medium text-gray-700">
              {value ? 'Enabled' : 'Disabled'}
            </span>
          </label>
        );
      
      case 'select':
        return (
          <select
            value={typeof value === 'string' || typeof value === 'number' ? value : ''}
            onChange={(e) => onPropertyChange(key, e.target.value)}
            className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white text-sm"
          >
            {options?.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        );
      
      default:
        return (
          <input
            type="text"
            value={String(value || '')}
            onChange={(e) => onPropertyChange(key, e.target.value)}
            className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
          />
        );
    }
  };

  const getPropertyDisplayName = (key: string) => {
    if (key === 'className') return 'CSS Classes';
    if (key === 'textContent') return 'Text Content';
    if (key.startsWith('style.')) {
      return `Style: ${key.replace('style.', '').replace(/([A-Z])/g, ' $1').toLowerCase()}`;
    }
    return key.charAt(0).toUpperCase() + key.slice(1);
  };

  return (
    <div className="h-full bg-white border-l border-gray-200 shadow-sm">
      <div className="p-3 sm:p-6 border-b border-gray-100 bg-gray-50">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900">Properties</h3>
        <p className="text-xs sm:text-sm text-gray-600 mt-1">
          {element.type} element
        </p>
      </div>
      
      <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
        {properties.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-gray-500">No editable properties available</p>
          </div>
        ) : (
          properties.map((property) => (
            <div key={property.key} className="space-y-2 sm:space-y-3">
              <label className="block text-xs sm:text-sm font-medium text-gray-800">
                {getPropertyDisplayName(property.key)}
              </label>
              {renderPropertyInput(property)}
            </div>
          ))
        )}
        
        {/* Quick style helpers */}
        <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-100">
          <h4 className="text-xs sm:text-sm font-semibold text-gray-800 mb-3 sm:mb-4">Quick Styles</h4>
          
          <div className="space-y-4 sm:space-y-5">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">Text Color</label>
              <div className="flex gap-1.5 sm:gap-2">
                {['text-gray-900', 'text-blue-600', 'text-red-600', 'text-green-600', 'text-yellow-600'].map((colorClass) => (
                  <button
                    key={colorClass}
                    onClick={() => {
                      const currentClasses = typeof element.props.className === 'string' ? element.props.className : '';
                      const newClasses = currentClasses
                        .split(' ')
                        .filter((cls: string) => !cls.startsWith('text-'))
                        .concat(colorClass)
                        .join(' ');
                      onPropertyChange('className', newClasses);
                    }}
                    className={`w-6 h-6 sm:w-8 sm:h-8 rounded-lg border-2 transition-all hover:scale-105 ${
                      colorClass === 'text-gray-900' ? 'bg-gray-900' :
                      colorClass === 'text-blue-600' ? 'bg-blue-600' :
                      colorClass === 'text-red-600' ? 'bg-red-600' :
                      colorClass === 'text-green-600' ? 'bg-green-600' :
                      'bg-yellow-600'
                    } ${(typeof element.props.className === 'string' && (element.props.className as string).includes(colorClass)) ? 'border-gray-800 shadow-md' : 'border-gray-200 hover:border-gray-300'}`}
                  />
                ))}
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">Font Weight</label>
              <div className="grid grid-cols-2 sm:flex gap-1.5 sm:gap-2">
                {['font-normal', 'font-medium', 'font-semibold', 'font-bold'].map((weightClass) => (
                  <button
                    key={weightClass}
                    onClick={() => {
                      const currentClasses = typeof element.props.className === 'string' ? element.props.className : '';
                      const newClasses = currentClasses
                        .split(' ')
                        .filter((cls: string) => !cls.startsWith('font-'))
                        .concat(weightClass)
                        .join(' ');
                      onPropertyChange('className', newClasses);
                    }}
                    className={`px-2 sm:px-3 py-1 sm:py-1.5 text-xs font-medium border rounded-lg transition-all ${
                      typeof element.props.className === 'string' && element.props.className.includes(weightClass) 
                        ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-sm' 
                        : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300'
                    }`}
                  >
                    {weightClass.replace('font-', '')}
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">Text Size</label>
              <div className="grid grid-cols-2 sm:flex gap-1.5 sm:gap-2">
                {['text-sm', 'text-base', 'text-lg', 'text-xl', 'text-2xl'].map((sizeClass) => (
                  <button
                    key={sizeClass}
                    onClick={() => {
                      const currentClasses = typeof element.props.className === 'string' ? element.props.className : '';
                      const newClasses = currentClasses
                        .split(' ')
                        .filter((cls: string) => !cls.startsWith('text-') || cls.includes('text-gray') || cls.includes('text-blue') || cls.includes('text-red') || cls.includes('text-green') || cls.includes('text-yellow'))
                        .concat(sizeClass)
                        .join(' ');
                      onPropertyChange('className', newClasses);
                    }}
                    className={`px-2 sm:px-3 py-1 sm:py-1.5 text-xs font-medium border rounded-lg transition-all ${
                      typeof element.props.className === 'string' && element.props.className.includes(sizeClass) 
                        ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-sm' 
                        : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300'
                    }`}
                  >
                    {sizeClass.replace('text-', '')}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
