/**
 * User management utilities for component ownership
 */

const USER_ID_KEY = 'react-editor-user-id';

/**
 * Generate a unique user ID
 */
export function generateUserId(): string {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 8);
  return `user_${timestamp}_${randomStr}`;
}

/**
 * Get the current user ID from localStorage, or create one if it doesn't exist
 */
export function getCurrentUserId(): string {
  if (typeof window === 'undefined') {
    // Server-side rendering fallback
    return 'temp_user';
  }

  try {
    let userId = localStorage.getItem(USER_ID_KEY);
    
    if (!userId) {
      userId = generateUserId();
      localStorage.setItem(USER_ID_KEY, userId);
    }
    
    return userId;
  } catch (error) {
    console.warn('Failed to access localStorage, using temporary user ID:', error);
    return 'temp_user';
  }
}

/**
 * Clear the current user ID (useful for testing or reset)
 */
export function clearUserId(): void {
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(USER_ID_KEY);
    } catch (error) {
      console.warn('Failed to clear user ID from localStorage:', error);
    }
  }
}

/**
 * Check if a component belongs to the current user
 */
export function isMyComponent(componentUserId: string | undefined): boolean {
  const currentUserId = getCurrentUserId();
  return componentUserId === currentUserId;
}
