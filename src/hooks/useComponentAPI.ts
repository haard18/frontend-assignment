import { useState, useCallback } from 'react';
import { ComponentData } from '@/types';

interface UseComponentAPIReturn {
  saveComponent: (component: ComponentData) => Promise<ComponentData | null>;
  loadComponent: (id: string) => Promise<ComponentData | null>;
  updateComponent: (id: string, updates: Partial<ComponentData>) => Promise<ComponentData | null>;
  deleteComponent: (id: string) => Promise<void>;
  loading: boolean;
  error: string | null;
}

export function useComponentAPI(): UseComponentAPIReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const saveComponent = useCallback(async (component: ComponentData): Promise<ComponentData | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/component', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(component),
      });

      if (!response.ok) {
        throw new Error('Failed to save component');
      }

      const savedComponent = await response.json();
      return savedComponent;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const loadComponent = useCallback(async (id: string): Promise<ComponentData | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/component/${id}`);

      if (!response.ok) {
        throw new Error('Failed to load component');
      }

      const component = await response.json();
      return component;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateComponent = useCallback(async (id: string, updates: Partial<ComponentData>): Promise<ComponentData | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/component/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error('Failed to update component');
      }

      const updatedComponent = await response.json();
      return updatedComponent;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteComponent = useCallback(async (id: string): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/component/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete component');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    saveComponent,
    loadComponent,
    updateComponent,
    deleteComponent,
    loading,
    error,
  };
}
