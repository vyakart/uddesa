import { useMemo } from 'react';
import type { ExcalidrawTextElement } from '@excalidraw/excalidraw/element/types';
import type { Scene } from '../../../editors/excalidraw/excalApi';
import type { OutlineItem } from '../../../ui/OutlinePanel';

function isTextElement(element: unknown): element is ExcalidrawTextElement {
  return Boolean(
    element &&
      typeof element === 'object' &&
      (element as ExcalidrawTextElement).type === 'text' &&
      !(element as ExcalidrawTextElement).isDeleted,
  );
}

function normaliseLabel(text: string): { label: string; detail?: string } {
  const lines = text.split('\n');
  const [firstLine, ...rest] = lines;
  const trimmedLabel = firstLine.trim();
  const label = trimmedLabel.length > 120 ? `${trimmedLabel.slice(0, 117)}…` : trimmedLabel;
  const remainder = rest.join(' ').trim();
  const detail = remainder.length > 160 ? `${remainder.slice(0, 157)}…` : remainder;
  return detail ? { label, detail } : { label };
}

function classifyLevel(element: ExcalidrawTextElement): 1 | 2 | 3 {
  const text = element.text.trim();
  if (text.length === 0) {
    return 3;
  }

  if (/^\s*#/.test(text) || (element.fontSize ?? 0) >= 44) {
    return 1;
  }

  if ((element.fontSize ?? 0) >= 28) {
    return 2;
  }

  if (/^[A-Z\d][A-Z\d\s.,'"-]{4,}$/.test(text) && !/[a-z]{3,}/.test(text)) {
    return 2;
  }

  return 3;
}

export function useOutline(scene: Scene | null | undefined): OutlineItem[] {
  return useMemo(() => {
    if (!scene) {
      return [];
    }

    const candidates = scene.elements
      .filter(isTextElement)
      .filter((element) => element.text.trim().length > 0);

    const sorted = [...candidates].sort((a, b) => {
      if (a.y === b.y) {
        return a.x - b.x;
      }
      return a.y - b.y;
    });

    return sorted.map<OutlineItem>((element) => {
      const { label, detail } = normaliseLabel(element.text);
      return {
        id: element.id,
        label: label || '(Untitled)',
        detail,
        level: classifyLevel(element),
        bounds: {
          x: element.x,
          y: element.y,
          width: element.width,
          height: element.height,
        },
      };
    });
  }, [scene]);
}
