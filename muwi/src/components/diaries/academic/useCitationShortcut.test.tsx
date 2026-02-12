import { fireEvent, renderHook } from '@/test';
import { useCitationShortcut } from './useCitationShortcut';

describe('useCitationShortcut', () => {
  it('opens citation picker on Ctrl/Cmd+Shift+C only', () => {
    const onOpen = vi.fn();
    renderHook(() => useCitationShortcut(onOpen));

    fireEvent.keyDown(window, { key: 'C', ctrlKey: true, shiftKey: true });
    expect(onOpen).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(window, { key: 'c', ctrlKey: true });
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onOpen).toHaveBeenCalledTimes(1);
  });
});
