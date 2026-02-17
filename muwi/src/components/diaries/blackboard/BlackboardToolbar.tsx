import { useState } from 'react';
import { useBlackboardStore } from '@/stores/blackboardStore';
import { FontSelector } from '@/components/common';

interface BlackboardToolbarProps {
  isIndexVisible: boolean;
  onToggleIndex: () => void;
}

type ToolName = 'select' | 'rectangle' | 'arrow' | 'text';

export function BlackboardToolbar({
  isIndexVisible,
  onToggleIndex,
}: BlackboardToolbarProps) {
  const [activeTool, setActiveTool] = useState<ToolName>('select');
  const canvas = useBlackboardStore((state) => state.canvas);
  const updateSettings = useBlackboardStore((state) => state.updateSettings);
  const setAppState = useBlackboardStore((state) => state.setAppState);

  const handleToggleGrid = () => {
    if (canvas) {
      updateSettings({ showGrid: !canvas.settings.showGrid });
    }
  };

  const handleBackgroundChange = (color: string) => {
    updateSettings({ backgroundColor: color });
  };

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

  const isGridEnabled = canvas?.settings?.showGrid ?? false;
  const backgroundColor = canvas?.settings?.backgroundColor ?? '#fdfbf7';
  const strokeColor = canvas?.settings?.defaultStrokeColor ?? '#000000';
  const strokeWidth = canvas?.settings?.defaultStrokeWidth ?? 2;
  const availableFonts = canvas?.settings?.fonts ?? ['Inter', 'Caveat', 'JetBrains Mono', 'Crimson Pro'];
  const selectedFont = canvas?.settings?.defaultFont ?? availableFonts[0] ?? 'Inter';

  const backgroundOptions = [
    { value: '#fdfbf7', label: 'Paper', isDark: false },
    { value: '#ffffff', label: 'White', isDark: false },
    { value: '#2D3436', label: 'Dark', isDark: true },
    { value: '#1a1a2e', label: 'Navy', isDark: true },
  ];

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '0 8px',
      }}
    >
      {/* Index toggle */}
      <button
        onClick={onToggleIndex}
        style={{
          height: '32px',
          padding: '0 12px',
          border: '1px solid #e0e0e0',
          borderRadius: '6px',
          backgroundColor: isIndexVisible ? '#e8e8e8' : '#ffffff',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '13px',
          color: '#333',
        }}
        title={isIndexVisible ? 'Hide index panel' : 'Show index panel'}
      >
        <span style={{ fontSize: '14px' }}>≡</span>
        Index
      </button>

      {/* Separator */}
      <div
        style={{
          width: '1px',
          height: '20px',
          backgroundColor: '#e0e0e0',
        }}
      />

      {/* Tool selection */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        {([
          { id: 'select', label: 'Select' },
          { id: 'rectangle', label: 'Rectangle' },
          { id: 'arrow', label: 'Arrow' },
          { id: 'text', label: 'Text' },
        ] as const).map((tool) => (
          <button
            key={tool.id}
            type="button"
            aria-pressed={activeTool === tool.id}
            onClick={() => handleToolSelect(tool.id)}
            style={{
              height: '32px',
              padding: '0 10px',
              border: '1px solid #e0e0e0',
              borderRadius: '6px',
              backgroundColor: activeTool === tool.id ? '#e8e8e8' : '#ffffff',
              cursor: 'pointer',
              fontSize: '12px',
              color: '#333',
            }}
          >
            {tool.label}
          </button>
        ))}
      </div>

      {/* Separator */}
      <div
        style={{
          width: '1px',
          height: '20px',
          backgroundColor: '#e0e0e0',
        }}
      />

      {/* Stroke controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#666' }}>
          Color
          <input
            type="color"
            aria-label="Stroke color"
            value={strokeColor}
            onChange={(event) => handleStrokeColorChange(event.target.value)}
            style={{ width: '28px', height: '24px', border: 'none', background: 'transparent', padding: 0 }}
          />
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#666' }}>
          Width
          <select
            aria-label="Stroke width"
            value={String(strokeWidth)}
            onChange={(event) => handleStrokeWidthChange(Number(event.target.value))}
            style={{ height: '26px', border: '1px solid #d8d8d8', borderRadius: '4px', fontSize: '12px' }}
          >
            <option value="1">1px</option>
            <option value="2">2px</option>
            <option value="3">3px</option>
            <option value="4">4px</option>
            <option value="5">5px</option>
          </select>
        </label>
      </div>

      {/* Separator */}
      <div
        style={{
          width: '1px',
          height: '20px',
          backgroundColor: '#e0e0e0',
        }}
      />

      <FontSelector fonts={availableFonts} value={selectedFont} onChange={handleFontChange} />

      {/* Separator */}
      <div
        style={{
          width: '1px',
          height: '20px',
          backgroundColor: '#e0e0e0',
        }}
      />

      {/* Grid toggle */}
      <button
        onClick={handleToggleGrid}
        style={{
          height: '32px',
          padding: '0 12px',
          border: '1px solid #e0e0e0',
          borderRadius: '6px',
          backgroundColor: isGridEnabled ? '#e8e8e8' : '#ffffff',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '13px',
          color: '#333',
        }}
        title={isGridEnabled ? 'Hide grid' : 'Show grid'}
      >
        <span style={{ fontSize: '12px' }}>#</span>
        Grid
      </button>

      {/* Separator */}
      <div
        style={{
          width: '1px',
          height: '20px',
          backgroundColor: '#e0e0e0',
        }}
      />

      {/* Background color selector */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
        }}
      >
        <span
          style={{
            fontSize: '12px',
            color: '#666',
            marginRight: '4px',
          }}
        >
          Background:
        </span>
        {backgroundOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => handleBackgroundChange(option.value)}
            style={{
              width: '24px',
              height: '24px',
              border:
                backgroundColor === option.value
                  ? '2px solid #4A90A4'
                  : '1px solid #ccc',
              borderRadius: '4px',
              backgroundColor: option.value,
              cursor: 'pointer',
              padding: 0,
            }}
            title={option.label}
          />
        ))}
      </div>
    </div>
  );
}
