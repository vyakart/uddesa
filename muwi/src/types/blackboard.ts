// Blackboard Types

export type CanvasElementType = 'text' | 'line' | 'circle' | 'rectangle' | 'arrow' | 'freehand' | 'table';

export interface ElementStyle {
  strokeColor: string;
  fillColor?: string;
  strokeWidth: number;
  fontFamily?: string;
  fontSize?: number;
  imperfectionSeed: number;
}

export interface CanvasElement {
  id: string;
  canvasId: string;
  type: CanvasElementType;
  position: { x: number; y: number };
  dimensions?: { width: number; height: number };
  points?: { x: number; y: number }[];
  content?: string;
  style: ElementStyle;
  headingLevel?: 1 | 2 | 3 | null;
  isLocked: boolean;
  createdAt: Date;
  modifiedAt: Date;
}

export interface ViewportState {
  panX: number;
  panY: number;
  zoom: number;
}

export interface IndexEntry {
  id: string;
  elementId: string;
  title: string;
  level: 1 | 2 | 3;
  position: { x: number; y: number };
}

export interface BlackboardCanvas {
  id: string;
  name: string;
  elementIds: string[];
  viewportState: ViewportState;
  index: IndexEntry[];
  settings: BlackboardSettings;
  createdAt: Date;
  modifiedAt: Date;
}

export interface BlackboardSettings {
  backgroundColor: string;
  showGrid: boolean;
  gridSize: number;
  defaultStrokeColor: string;
  defaultStrokeWidth: number;
  fonts: string[];
  defaultFont: string;
}

export const defaultBlackboardSettings: BlackboardSettings = {
  backgroundColor: '#2D3436',
  showGrid: false,
  gridSize: 20,
  defaultStrokeColor: '#F5F5F5',
  defaultStrokeWidth: 2,
  fonts: ['Inter', 'Caveat', 'JetBrains Mono', 'Crimson Pro'],
  defaultFont: 'Inter',
};
