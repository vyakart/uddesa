import { act, fireEvent, render, screen } from '@/test';
import { useBlackboardStore } from '@/stores/blackboardStore';
import type { BlackboardCanvas } from '@/types';
import { BlackboardToolbar } from './BlackboardToolbar';

function makeCanvas(overrides: Partial<BlackboardCanvas> = {}): BlackboardCanvas {
  const now = new Date('2026-02-11T00:00:00.000Z');
  return {
    id: 'canvas-1',
    name: 'Canvas',
    elementIds: [],
    viewportState: { panX: 0, panY: 0, zoom: 1 },
    index: [],
    settings: {
      backgroundColor: '#fdfbf7',
      showGrid: false,
      gridSize: 20,
      defaultStrokeColor: '#F5F5F5',
      defaultStrokeWidth: 2,
      fonts: ['Inter', 'Caveat', 'JetBrains Mono'],
      defaultFont: 'Inter',
    },
    createdAt: now,
    modifiedAt: now,
    ...overrides,
  };
}

describe('BlackboardToolbar', () => {
  beforeEach(() => {
    useBlackboardStore.setState(useBlackboardStore.getInitialState(), true);
  });

  it('toggles index visibility and grid settings', () => {
    const onToggleIndex = vi.fn();
    const updateSettings = vi.fn().mockResolvedValue(undefined);
    const setAppState = vi.fn();

    useBlackboardStore.setState({
      canvas: makeCanvas(),
      updateSettings,
      setAppState,
    });

    render(<BlackboardToolbar isIndexVisible onToggleIndex={onToggleIndex} />);

    fireEvent.click(screen.getByRole('button', { name: /Index/i }));
    expect(onToggleIndex).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: /Grid/i }));
    expect(updateSettings).toHaveBeenCalledWith({ showGrid: true });

    fireEvent.click(screen.getByRole('button', { name: 'Rectangle' }));
    expect(setAppState).toHaveBeenCalled();
  });

  it('updates background/stroke settings and handles missing canvas', () => {
    const onToggleIndex = vi.fn();
    const updateSettings = vi.fn().mockResolvedValue(undefined);

    useBlackboardStore.setState({
      canvas: makeCanvas(),
      updateSettings,
    });

    render(<BlackboardToolbar isIndexVisible={false} onToggleIndex={onToggleIndex} />);

    fireEvent.click(screen.getByTitle('Navy'));
    expect(updateSettings).toHaveBeenCalledWith({ backgroundColor: '#1a1a2e' });

    fireEvent.change(screen.getByLabelText('Stroke color'), { target: { value: '#123456' } });
    expect(updateSettings).toHaveBeenCalledWith({ defaultStrokeColor: '#123456' });

    fireEvent.change(screen.getByLabelText('Stroke width'), { target: { value: '4' } });
    expect(updateSettings).toHaveBeenCalledWith({ defaultStrokeWidth: 4 });

    fireEvent.change(screen.getByRole('combobox', { name: 'Font' }), { target: { value: 'Caveat' } });
    expect(updateSettings).toHaveBeenCalledWith({ defaultFont: 'Caveat' });

    act(() => {
      useBlackboardStore.setState({ canvas: null });
    });
    const callCountBeforeGrid = updateSettings.mock.calls.length;
    fireEvent.click(screen.getByRole('button', { name: /Grid/i }));
    expect(updateSettings).toHaveBeenCalledTimes(callCountBeforeGrid);
  });

  it('renders available fonts in selector', () => {
    const updateSettings = vi.fn().mockResolvedValue(undefined);
    useBlackboardStore.setState({
      canvas: makeCanvas(),
      updateSettings,
    });

    render(<BlackboardToolbar isIndexVisible onToggleIndex={vi.fn()} />);

    const fontSelect = screen.getByRole('combobox', { name: 'Font' });
    const options = Array.from(fontSelect.querySelectorAll('option'));
    expect(options.map((option) => option.textContent)).toEqual(['Inter', 'Caveat', 'JetBrains Mono']);
  });
});
