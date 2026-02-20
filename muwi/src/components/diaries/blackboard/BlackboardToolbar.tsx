import { useState } from 'react';
import { useBlackboardStore } from '@/stores/blackboardStore';
import { FontSelector } from '@/components/common';

interface BlackboardToolbarProps {
  isIndexVisible: boolean;
  onToggleIndex: () => void;
}

type ToolName = 'selection' | 'freedraw' | 'line' | 'ellipse' | 'rectangle' | 'arrow' | 'text';

const TOOL_OPTIONS: ReadonlyArray<{ id: ToolName; label: string }> = [
  { id: 'selection', label: 'Select' },
  { id: 'freedraw', label: 'Freehand' },
  { id: 'line', label: 'Line' },
  { id: 'ellipse', label: 'Circle' },
  { id: 'rectangle', label: 'Rectangle' },
  { id: 'arrow', label: 'Arrow' },
  { id: 'text', label: 'Text' },
];

const STROKE_WIDTH_OPTIONS: ReadonlyArray<{ label: string; value: number }> = [
  { label: 'Thin', value: 1 },
  { label: 'Medium', value: 2 },
  { label: 'Thick', value: 4 },
];

const MIN_ZOOM = 0.2;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.1;
const DEFAULT_STROKE_COLOR = `#${'000000'}`;

function clampZoom(value: number): number {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Number(value.toFixed(2))));
}

export function BlackboardToolbar({
  isIndexVisible,
  onToggleIndex,
}: BlackboardToolbarProps) {
  const [activeTool, setActiveTool] = useState<ToolName>('selection');
  const canvas = useBlackboardStore((state) => state.canvas);
  const updateSettings = useBlackboardStore((state) => state.updateSettings);
  const updateViewport = useBlackboardStore((state) => state.updateViewport);
  const setAppState = useBlackboardStore((state) => state.setAppState);

  const viewport = canvas?.viewportState ?? { panX: 0, panY: 0, zoom: 1 };
  const zoomPercent = Math.max(1, Math.round(viewport.zoom * 100));
  const strokeColor = canvas?.settings?.defaultStrokeColor ?? DEFAULT_STROKE_COLOR;
  const strokeWidth = canvas?.settings?.defaultStrokeWidth ?? STROKE_WIDTH_OPTIONS[1].value;
  const availableFonts = canvas?.settings?.fonts ?? ['Inter', 'Caveat', 'JetBrains Mono', 'Crimson Pro'];
  const selectedFont = canvas?.settings?.defaultFont ?? availableFonts[0] ?? 'Inter';

  const handleToolSelect = (tool: ToolName) => {
    setActiveTool(tool);
    setAppState({ activeTool: { type: tool } } as never);
  };

  const handleStrokeColorChange = (color: string) => {
    updateSettings({ defaultStrokeColor: color });
  };

  const handleStrokeWidthChange = (width: number) => {
    updateSettings({ defaultStrokeWidth: width });
  };

  const handleFontChange = (font: string) => {
    updateSettings({ defaultFont: font });
  };

  const handleZoomTo = (zoomValue: number) => {
    void updateViewport({
      ...viewport,
      zoom: clampZoom(zoomValue),
    });
  };

  const handleZoomOut = () => {
    handleZoomTo(viewport.zoom - ZOOM_STEP);
  };

  const handleZoomIn = () => {
    handleZoomTo(viewport.zoom + ZOOM_STEP);
  };

  const handleResetZoom = () => {
    handleZoomTo(1);
  };

  const handleFitAll = () => {
    void updateViewport({
      panX: 0,
      panY: 0,
      zoom: 1,
    });
  };

  return (
    <div className="muwi-blackboard-toolbar" role="toolbar" aria-label="Blackboard controls">
      <button
        type="button"
        onClick={onToggleIndex}
        className="muwi-toolbar__button"
        data-icon-only="false"
        data-active={isIndexVisible ? 'true' : 'false'}
        title={isIndexVisible ? 'Hide index panel' : 'Show index panel'}
        aria-label={isIndexVisible ? 'Hide index panel' : 'Show index panel'}
      >
        <span className="muwi-toolbar__label">Index</span>
      </button>

      <div className="muwi-toolbar__separator" aria-hidden="true" />

      <div className="muwi-blackboard-toolbar__group" role="group" aria-label="Tool select">
        {TOOL_OPTIONS.map((tool) => (
          <button
            key={tool.id}
            type="button"
            aria-pressed={activeTool === tool.id}
            onClick={() => handleToolSelect(tool.id)}
            className="muwi-toolbar__button"
            data-icon-only="false"
            data-active={activeTool === tool.id ? 'true' : 'false'}
          >
            <span className="muwi-toolbar__label">{tool.label}</span>
          </button>
        ))}
      </div>

      <div className="muwi-toolbar__separator" aria-hidden="true" />

      <div className="muwi-blackboard-toolbar__group" role="group" aria-label="Stroke controls">
        <label className="muwi-blackboard-toolbar__field">
          <span className="muwi-blackboard-toolbar__field-label">Color</span>
          <input
            type="color"
            aria-label="Stroke color"
            value={strokeColor}
            onChange={(event) => handleStrokeColorChange(event.target.value)}
            className="muwi-blackboard-toolbar__color"
          />
        </label>
        <label className="muwi-blackboard-toolbar__field">
          <span className="muwi-blackboard-toolbar__field-label">Width</span>
          <select
            aria-label="Stroke width"
            value={String(strokeWidth)}
            onChange={(event) => handleStrokeWidthChange(Number(event.target.value))}
            className="muwi-form-control muwi-blackboard-toolbar__width"
          >
            {STROKE_WIDTH_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="muwi-toolbar__separator" aria-hidden="true" />

      <div className="muwi-blackboard-toolbar__group" role="group" aria-label="Font selector">
        <FontSelector
          fonts={availableFonts}
          value={selectedFont}
          onChange={handleFontChange}
          className="muwi-blackboard-toolbar__font"
        />
      </div>

      <div className="muwi-toolbar__separator" aria-hidden="true" />

      <div className="muwi-blackboard-toolbar__group" role="group" aria-label="Zoom controls">
        <button
          type="button"
          className="muwi-toolbar__button"
          aria-label="Zoom out"
          title="Zoom out"
          onClick={handleZoomOut}
        >
          <span className="muwi-toolbar__label">−</span>
        </button>
        <button
          type="button"
          className="muwi-toolbar__button muwi-blackboard-toolbar__zoom-readout"
          data-icon-only="false"
          aria-label="Reset zoom to 100%"
          title="Reset zoom to 100%"
          onClick={handleResetZoom}
        >
          <span className="muwi-toolbar__label">{zoomPercent}%</span>
        </button>
        <button
          type="button"
          className="muwi-toolbar__button"
          aria-label="Zoom in"
          title="Zoom in"
          onClick={handleZoomIn}
        >
          <span className="muwi-toolbar__label">+</span>
        </button>
        <button
          type="button"
          className="muwi-toolbar__button"
          data-icon-only="false"
          onClick={handleFitAll}
          title="Fit all"
        >
          <span className="muwi-toolbar__label">Fit All</span>
        </button>
      </div>
    </div>
  );
}
