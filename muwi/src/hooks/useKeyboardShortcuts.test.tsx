import { fireEvent, renderHook } from '@/test';
import { useKeyboardShortcuts } from './useKeyboardShortcuts';

const ctrlOrMetaModifier = () =>
  navigator.platform.toUpperCase().includes('MAC') ? { metaKey: true } : { ctrlKey: true };

describe('useKeyboardShortcuts', () => {
  it('ignores key mismatches and modifier mismatches', () => {
    const action = vi.fn();

    renderHook(() =>
      useKeyboardShortcuts([{ key: 'a', modifiers: ['ctrl'], action }])
    );

    fireEvent.keyDown(window, { key: 'b', ...ctrlOrMetaModifier() });
    fireEvent.keyDown(window, { key: 'a', ...ctrlOrMetaModifier(), shiftKey: true });

    expect(action).not.toHaveBeenCalled();
  });

  it('blocks plain shortcuts inside input fields but allows modified shortcuts', () => {
    const plainAction = vi.fn();
    const modifiedAction = vi.fn();

    renderHook(() =>
      useKeyboardShortcuts([
        { key: 'x', action: plainAction },
        { key: 'b', modifiers: ['ctrl'], action: modifiedAction },
      ])
    );

    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();

    fireEvent.keyDown(input, { key: 'x' });
    fireEvent.keyDown(input, { key: 'b', ...ctrlOrMetaModifier() });

    expect(plainAction).not.toHaveBeenCalled();
    expect(modifiedAction).toHaveBeenCalledTimes(1);

    input.remove();
  });

  it('supports preventDefault opt-out and disabled mode', () => {
    const enabledAction = vi.fn();
    const disabledAction = vi.fn();

    renderHook(() =>
      useKeyboardShortcuts([{ key: 'z', action: enabledAction, preventDefault: false }])
    );
    renderHook(() =>
      useKeyboardShortcuts([{ key: 'q', action: disabledAction }], { enabled: false })
    );

    const zEvent = new KeyboardEvent('keydown', {
      key: 'z',
      bubbles: true,
      cancelable: true,
    });
    window.dispatchEvent(zEvent);

    const qEvent = new KeyboardEvent('keydown', {
      key: 'q',
      bubbles: true,
      cancelable: true,
    });
    window.dispatchEvent(qEvent);

    expect(enabledAction).toHaveBeenCalledTimes(1);
    expect(zEvent.defaultPrevented).toBe(false);
    expect(disabledAction).not.toHaveBeenCalled();
  });

  it('can bind to the document target', () => {
    const action = vi.fn();

    renderHook(() =>
      useKeyboardShortcuts([{ key: 'Escape', action }], { target: 'document' })
    );

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(action).toHaveBeenCalledTimes(1);
  });

  it('handles special keys and cleans up listeners on unmount', () => {
    const action = vi.fn();

    const { unmount } = renderHook(() =>
      useKeyboardShortcuts([{ key: 'PageDown', action }])
    );

    fireEvent.keyDown(window, { key: 'PageDown' });
    expect(action).toHaveBeenCalledTimes(1);

    unmount();
    fireEvent.keyDown(window, { key: 'PageDown' });
    expect(action).toHaveBeenCalledTimes(1);
  });
});
