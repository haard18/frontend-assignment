export interface ComponentData {
  id?: string;
  name: string;
  code: string;
  serializedComponent: SerializedElement;
  createdAt?: string;
  updatedAt?: string;
}

export interface SerializedElement {
  type: string;
  props: Record<string, unknown>;
  children: (SerializedElement | string)[];
  id: string;
}

export interface EditableProperty {
  key: string;
  value: unknown;
  type: 'text' | 'color' | 'number' | 'boolean' | 'select';
  options?: string[];
}

export interface SelectedElement {
  id: string;
  element: SerializedElement;
  path: number[];
  properties: EditableProperty[];
}

export interface EditorState {
  selectedElement: SelectedElement | null;
  isEditing: boolean;
  hoveredElement: string | null;
}
