import type { Scene } from './excalApi';
import { exportToCanvas } from './export';

interface ThumbnailOptions {
  maxWidth?: number;
  placeholderColor?: string;
}

export async function sceneToThumbnail(scene: Scene, options: ThumbnailOptions = {}): Promise<string> {
  if (typeof window === 'undefined') {
    return '';
  }

  const { maxWidth = 200, placeholderColor } = options;
  const canvas = await exportToCanvas(scene, maxWidth);

  if (canvas.width === 0 || canvas.height === 0) {
    const fallbackCanvas = document.createElement('canvas');
    fallbackCanvas.width = maxWidth;
    fallbackCanvas.height = Math.round(maxWidth * 1.4);
    const context = fallbackCanvas.getContext('2d');
    if (context) {
      context.fillStyle = placeholderColor ?? '#f3f3f3';
      context.fillRect(0, 0, fallbackCanvas.width, fallbackCanvas.height);
    }
    return fallbackCanvas.toDataURL('image/png');
  }

  return canvas.toDataURL('image/png');
}
