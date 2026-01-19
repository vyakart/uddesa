import { useBlackboardStore } from '@/stores/blackboardStore';

interface BlackboardToolbarProps {
  isIndexVisible: boolean;
  onToggleIndex: () => void;
}

export function BlackboardToolbar({
  isIndexVisible,
  onToggleIndex,
}: BlackboardToolbarProps) {
  const canvas = useBlackboardStore((state) => state.canvas);
  const updateSettings = useBlackboardStore((state) => state.updateSettings);

  const handleToggleGrid = () => {
    if (canvas) {
      updateSettings({ showGrid: !canvas.settings.showGrid });
    }
  };

  const handleBackgroundChange = (color: string) => {
    updateSettings({ backgroundColor: color });
  };

  const isGridEnabled = canvas?.settings?.showGrid ?? false;
  const backgroundColor = canvas?.settings?.backgroundColor ?? '#fdfbf7';

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
