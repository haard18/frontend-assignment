import { ComponentData } from '@/types';
const componentStore = new Map<string, ComponentData>();

export function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

export function saveComponent(componentData: ComponentData): ComponentData {
  const id = componentData.id || generateId();
  const savedComponent = {
    ...componentData,
    id,
    updatedAt: new Date().toISOString(),
  };
  
  componentStore.set(id, savedComponent);
  return savedComponent;
}

export function getComponent(id: string): ComponentData | null {
  return componentStore.get(id) || null;
}

export function getAllComponents(): ComponentData[] {
  return Array.from(componentStore.values());
}

export function deleteComponent(id: string): boolean {
  return componentStore.delete(id);
}
