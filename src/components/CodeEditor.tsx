import React, { useState } from 'react';
import Prism from 'prismjs';
import 'prismjs/components/prism-jsx';

interface CodeEditorProps {
  code: string;
  onChange: (code: string) => void;
  onParse: (code: string) => void;
}

export function CodeEditor({ code, onChange, onParse }: CodeEditorProps) {
  const [localCode, setLocalCode] = useState(code);
  const [parseError, setParseError] = useState<string | null>(null);

  React.useEffect(() => {
    setLocalCode(code);
  }, [code]);

  const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newCode = e.target.value;
    setLocalCode(newCode);
    setParseError(null); // Clear previous errors
    
    // Debounce the onChange call to avoid too many parsing attempts
    const timeoutId = setTimeout(() => {
      try {
        onChange(newCode);
      } catch (error) {
        setParseError(error instanceof Error ? error.message : 'Parse error');
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  };

  const handleParseClick = () => {
    try {
      setParseError(null);
      onParse(localCode);
    } catch (error) {
      setParseError(error instanceof Error ? error.message : 'Parse error');
    }
  };

  // Syntax highlighting
  const highlightedCode = React.useMemo(() => {
    try {
      return Prism.highlight(localCode, Prism.languages.jsx, 'jsx');
    } catch {
      return localCode;
    }
  }, [localCode]);

  return (
    <div className="h-full flex flex-col bg-gray-900 border border-gray-200 rounded-lg overflow-hidden shadow-sm">
      <div className="bg-gray-800 border-b border-gray-700 p-2 sm:p-4 flex items-center justify-between">
        <div className="flex items-center gap-3 sm:gap-6 min-w-0 flex-1">
          <h3 className="text-white font-semibold text-sm sm:text-base">Component Code</h3>
          <div className="hidden sm:flex items-center gap-4 text-xs text-gray-400">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span>Editor</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              <span>Preview</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          {parseError && (
            <div className="flex items-center gap-1 sm:gap-2">
              <div className="w-2 h-2 bg-red-400 rounded-full"></div>
              <span className="text-red-400 text-xs sm:text-sm font-medium hidden sm:inline">Parse Error</span>
            </div>
          )}
          <button
            onClick={handleParseClick}
            className="px-2 sm:px-4 py-1.5 sm:py-2 bg-blue-600 text-white text-xs sm:text-sm font-medium rounded-lg hover:bg-blue-700 transition-all duration-200 shadow-sm"
          >
            <span className="hidden sm:inline">Parse Component</span>
            <span className="sm:hidden">Parse</span>
          </button>
        </div>
      </div>
      
      {parseError && (
        <div className="bg-gradient-to-r from-red-900 to-red-800 border-b border-red-700 px-3 sm:px-4 py-2 sm:py-3">
          <p className="text-red-200 text-xs sm:text-sm font-medium">
            <strong>Error:</strong> {parseError}
          </p>
          <p className="text-red-300 text-xs sm:text-sm mt-1">
            Tip: Make sure adjacent JSX elements are wrapped in a fragment &lt;&gt;...&lt;/&gt; or a div.
          </p>
        </div>
      )}
      
      <div className="flex-1 flex flex-col sm:flex-row">
        {/* Code input area */}
        <div className="w-full sm:w-1/2 h-1/2 sm:h-full relative">
          <textarea
            value={localCode}
            onChange={handleCodeChange}
            className="w-full h-full p-2 sm:p-4 bg-gray-800 text-white resize-none outline-none font-mono text-xs sm:text-sm border-b sm:border-b-0 sm:border-r border-gray-600 leading-relaxed"
            spellCheck={false}
            placeholder="Paste your JSX code here..."
          />
        </div>
        
        {/* Syntax highlighted preview */}
        <div className="w-full sm:w-1/2 h-1/2 sm:h-full relative bg-gray-900">
          <pre
            className="w-full h-full p-2 sm:p-4 font-mono text-xs sm:text-sm overflow-auto text-white leading-relaxed"
            style={{ margin: 0 }}
          >
            <code
              className="language-jsx"
              dangerouslySetInnerHTML={{ __html: highlightedCode }}
            />
          </pre>
        </div>
      </div>
    </div>
  );
}
