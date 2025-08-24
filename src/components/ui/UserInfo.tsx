'use client';

import React, { useState, useEffect } from 'react';
import { User, Copy, Check } from 'lucide-react';
import { getCurrentUserId } from '@/lib/userUtils';

interface UserInfoProps {
  className?: string;
}

export function UserInfo({ className = '' }: UserInfoProps) {
  const [userId, setUserId] = useState<string>('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setUserId(getCurrentUserId());
  }, []);

  const handleCopyUserId = async () => {
    try {
      await navigator.clipboard.writeText(userId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.warn('Failed to copy user ID:', error);
    }
  };

  if (!userId || userId === 'temp_user') {
    return null;
  }

  return (
    <div className={`flex items-center gap-2 text-xs text-gray-500 ${className}`}>
      <User className="w-3 h-3" />
      <span className="font-mono">ID: {userId.slice(-8)}</span>
      <button
        onClick={handleCopyUserId}
        className="p-1 hover:bg-gray-100 rounded transition-colors"
        title="Copy full user ID"
      >
        {copied ? (
          <Check className="w-3 h-3 text-green-500" />
        ) : (
          <Copy className="w-3 h-3" />
        )}
      </button>
    </div>
  );
}
