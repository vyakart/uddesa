export type Scene = {
  elements: unknown[];
  appState: Record<string, unknown>;
  files: Record<string, unknown>;
};

function clone<T>(value: T): T {
  if (typeof structuredClone === 'function') {
    return structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value)) as T;
}

let memoryScene: Scene = {
  elements: [],
  appState: {},
  files: {},
};

export function load(scene: Scene): void {
  memoryScene = {
    elements: clone(scene.elements),
    appState: clone(scene.appState),
    files: clone(scene.files),
  };
}

export function read(): Scene {
  return {
    elements: clone(memoryScene.elements),
    appState: clone(memoryScene.appState),
    files: clone(memoryScene.files),
  };
}

export function update(partial: Partial<Scene>): void {
  memoryScene = {
    elements: partial.elements ? clone(partial.elements) : memoryScene.elements,
    appState: partial.appState ? clone(partial.appState) : memoryScene.appState,
    files: partial.files ? clone(partial.files) : memoryScene.files,
  };
}

export async function exportScene(kind: 'png' | 'svg'): Promise<Blob> {
  const payload = JSON.stringify({ kind, scene: memoryScene });
  const type = kind === 'svg' ? 'image/svg+xml' : 'image/png';
  return new Blob([payload], { type });
}

export function centerOn(bounds: { x: number; y: number; width: number; height: number }): void {
  void bounds;
  // Placeholder until Excalidraw integration ships in PR2.
}
