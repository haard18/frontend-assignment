'use client';

import React, { useState, useEffect } from 'react';
import { X, Sparkles, User } from 'lucide-react';
import { getCurrentUserId } from '@/lib/userUtils';

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WelcomeModal({ isOpen, onClose }: WelcomeModalProps) {
  const [userId, setUserId] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setUserId(getCurrentUserId());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-2 sm:p-4">
        <div className="fixed inset-0 bg-black bg-opacity-25 transition-opacity" onClick={onClose} />
        
        <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">Welcome!</h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 focus:outline-none"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
            <p className="text-gray-600">
              Welcome to the React Component Editor! You've been assigned a unique user ID to keep track of your components.
            </p>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <User className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">Your User ID</span>
              </div>
              <p className="text-xs font-mono text-blue-700 bg-white px-2 py-1 rounded border">
                {userId}
              </p>
              <p className="text-xs text-blue-600 mt-2">
                This ID is stored in your browser and allows you to access your saved components.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium text-gray-900">Features:</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Create and edit React components visually</li>
                <li>• Save components to your personal library</li>
                <li>• Edit component properties in real-time</li>
                <li>• Export and import component code</li>
              </ul>
            </div>

            <button
              onClick={onClose}
              className="w-full px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Get Started
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function useWelcomeModal() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Check if user has seen welcome modal before
    const hasSeenWelcome = localStorage.getItem('react-editor-welcome-seen');
    if (!hasSeenWelcome) {
      setIsOpen(true);
    }
  }, []);

  const closeModal = () => {
    setIsOpen(false);
    localStorage.setItem('react-editor-welcome-seen', 'true');
  };

  return {
    isWelcomeOpen: isOpen,
    closeWelcome: closeModal,
  };
}
