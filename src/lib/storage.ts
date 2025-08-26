import { ComponentData } from '@/types';

// In-memory store for fast access
const componentStore = new Map<string, ComponentData>();

// Storage keys
const STORAGE_KEY = 'react-editor-components';
const LAST_SYNC_KEY = 'react-editor-last-sync';

export function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

// Initialize storage from localStorage on first load
function initializeStorage() {
  if (typeof window === 'undefined') return; // Skip on server-side
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const components: ComponentData[] = JSON.parse(stored);
      components.forEach(component => {
        componentStore.set(component.id!, component);
      });
      console.log(`Loaded ${components.length} components from localStorage`);
    }
  } catch (error) {
    console.error('Error loading components from localStorage:', error);
  }
}

// Persist current store to localStorage
function persistToStorage() {
  if (typeof window === 'undefined') return; // Skip on server-side
  
  try {
    const components = Array.from(componentStore.values());
    localStorage.setItem(STORAGE_KEY, JSON.stringify(components));
    localStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());
    console.log(`Persisted ${components.length} components to localStorage`);
  } catch (error) {
    console.error('Error persisting components to localStorage:', error);
  }
}

// Auto-initialize on module load
if (typeof window !== 'undefined') {
  initializeStorage();
}

export function saveComponent(componentData: ComponentData): ComponentData {
  const id = componentData.id || generateId();
  const savedComponent = {
    ...componentData,
    id,
    updatedAt: new Date().toISOString(),
  };
  
  componentStore.set(id, savedComponent);
  persistToStorage(); // Persist to localStorage immediately
  return savedComponent;
}

export function getComponent(id: string): ComponentData | null {
  return componentStore.get(id) || null;
}

export function getAllComponents(): ComponentData[] {
  return Array.from(componentStore.values());
}

export function deleteComponent(id: string): boolean {
  const deleted = componentStore.delete(id);
  if (deleted) {
    persistToStorage(); // Persist changes immediately
  }
  return deleted;
}

export function updateComponent(id: string, updates: Partial<ComponentData>): ComponentData | null {
  const existing = componentStore.get(id);
  if (!existing) return null;
  
  const updated = {
    ...existing,
    ...updates,
    id, // Ensure ID doesn't change
    updatedAt: new Date().toISOString(),
  };
  
  componentStore.set(id, updated);
  persistToStorage(); // Persist changes immediately
  return updated;
}

// Export functions for manual storage management
export function clearAllComponents(): void {
  componentStore.clear();
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(LAST_SYNC_KEY);
  }
}

export function exportComponents(): string {
  const components = getAllComponents();
  return JSON.stringify(components, null, 2);
}

export function importComponents(jsonData: string): { success: boolean; count: number; error?: string } {
  try {
    const components: ComponentData[] = JSON.parse(jsonData);
    
    if (!Array.isArray(components)) {
      return { success: false, count: 0, error: 'Invalid data format' };
    }
    
    let count = 0;
    components.forEach(component => {
      if (component.serializedComponent && component.code) {
        const id = component.id || generateId();
        const validComponent = {
          ...component,
          id,
          importedAt: new Date().toISOString(),
        };
        componentStore.set(id, validComponent);
        count++;
      }
    });
    
    persistToStorage();
    return { success: true, count };
  } catch (error) {
    return { 
      success: false, 
      count: 0, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

export function getStorageInfo(): { count: number; lastSync: string | null; storageSize: number } {
  const components = getAllComponents();
  const lastSync = typeof window !== 'undefined' 
    ? localStorage.getItem(LAST_SYNC_KEY) 
    : null;
  
  let storageSize = 0;
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(STORAGE_KEY);
    storageSize = stored ? new Blob([stored]).size : 0;
  }
  
  return {
    count: components.length,
    lastSync,
    storageSize,
  };
}
