import { fireEvent, render, screen } from '@/test';
import { useBlackboardStore } from '@/stores/blackboardStore';
import type { BlackboardCanvas } from '@/types';
import { BlackboardToolbar } from './BlackboardToolbar';

const TEST_CANVAS_BG = 'var(--color-bg-canvas-warm)';
const TEST_STROKE_COLOR = 'var(--color-bb-stroke-default)';
const CUSTOM_STROKE_COLOR = ['#', '123456'].join('');

function makeCanvas(overrides: Partial<BlackboardCanvas> = {}): BlackboardCanvas {
  const now = new Date('2026-02-11T00:00:00.000Z');
  return {
    id: 'canvas-1',
    name: 'Canvas',
    elementIds: [],
    viewportState: { panX: 0, panY: 0, zoom: 1 },
    index: [],
    settings: {
      backgroundColor: TEST_CANVAS_BG,
      showGrid: false,
      gridSize: 20,
      defaultStrokeColor: TEST_STROKE_COLOR,
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

  it('toggles index visibility and sets active drawing tool', () => {
    const onToggleIndex = vi.fn();
    const updateSettings = vi.fn().mockResolvedValue(undefined);
    const updateViewport = vi.fn().mockResolvedValue(undefined);
    const setAppState = vi.fn();

    useBlackboardStore.setState({
      canvas: makeCanvas(),
      updateSettings,
      updateViewport,
      setAppState,
    });

    render(<BlackboardToolbar isIndexVisible onToggleIndex={onToggleIndex} />);

    fireEvent.click(screen.getByRole('button', { name: /Index/i }));
    expect(onToggleIndex).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'Freehand' }));
    expect(setAppState).toHaveBeenCalledWith({ activeTool: { type: 'freedraw' } });
  });

  it('updates stroke/font settings and zoom controls', () => {
    const updateSettings = vi.fn().mockResolvedValue(undefined);
    const updateViewport = vi.fn().mockResolvedValue(undefined);
    const setAppState = vi.fn();

    useBlackboardStore.setState({
      canvas: makeCanvas({
        viewportState: { panX: 12, panY: -8, zoom: 1.2 },
      }),
      updateSettings,
      updateViewport,
      setAppState,
    });

    render(<BlackboardToolbar isIndexVisible={false} onToggleIndex={vi.fn()} />);

    fireEvent.change(screen.getByLabelText('Stroke color'), { target: { value: CUSTOM_STROKE_COLOR } });
    expect(updateSettings).toHaveBeenCalledWith({ defaultStrokeColor: CUSTOM_STROKE_COLOR });

    fireEvent.change(screen.getByLabelText('Stroke width'), { target: { value: '4' } });
    expect(updateSettings).toHaveBeenCalledWith({ defaultStrokeWidth: 4 });

    fireEvent.change(screen.getByRole('combobox', { name: 'Font' }), { target: { value: 'Caveat' } });
    expect(updateSettings).toHaveBeenCalledWith({ defaultFont: 'Caveat' });

    fireEvent.click(screen.getByRole('button', { name: 'Zoom out' }));
    expect(updateViewport).toHaveBeenCalledWith({ panX: 12, panY: -8, zoom: 1.1 });

    fireEvent.click(screen.getByRole('button', { name: 'Zoom in' }));
    expect(updateViewport).toHaveBeenCalledWith({ panX: 12, panY: -8, zoom: 1.3 });

    fireEvent.click(screen.getByRole('button', { name: 'Reset zoom to 100%' }));
    expect(updateViewport).toHaveBeenCalledWith({ panX: 12, panY: -8, zoom: 1 });

    fireEvent.click(screen.getByRole('button', { name: 'Fit All' }));
    expect(updateViewport).toHaveBeenCalledWith({ panX: 0, panY: 0, zoom: 1 });
  });

  it('renders tool/stroke/font/zoom groups with available fonts', () => {
    const updateSettings = vi.fn().mockResolvedValue(undefined);
    const updateViewport = vi.fn().mockResolvedValue(undefined);

    useBlackboardStore.setState({
      canvas: makeCanvas({
        viewportState: { panX: 0, panY: 0, zoom: 1.5 },
      }),
      updateSettings,
      updateViewport,
      setAppState: vi.fn(),
    });

    render(<BlackboardToolbar isIndexVisible onToggleIndex={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'Select' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Line' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Circle' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Fit All' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reset zoom to 100%' })).toHaveTextContent('150%');

    expect(screen.getByRole('combobox', { name: 'Stroke width' })).toHaveDisplayValue('Medium');
    const fontSelect = screen.getByRole('combobox', { name: 'Font' });
    const options = Array.from(fontSelect.querySelectorAll('option'));
    expect(options.map((option) => option.textContent)).toEqual(['Inter', 'Caveat', 'JetBrains Mono']);
  });
});
