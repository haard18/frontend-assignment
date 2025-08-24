'use client';

import React, { Suspense } from 'react';
import { WebsiteEditor } from './WebsiteEditor';
import { WelcomeModal, useWelcomeModal } from './ui/WelcomeModal';

function WebsiteEditorWithSearchParams() {
  const { isWelcomeOpen, closeWelcome } = useWelcomeModal();

  return (
    <>
      <WebsiteEditor />
      <WelcomeModal isOpen={isWelcomeOpen} onClose={closeWelcome} />
    </>
  );
}

export function WebsiteEditorWrapper() {
  return (
    <Suspense fallback={
      <div className="h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading editor...</p>
        </div>
      </div>
    }>
      <WebsiteEditorWithSearchParams />
    </Suspense>
  );
}
