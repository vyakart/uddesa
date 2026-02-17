import type { Editor } from '@tiptap/react';
import { fireEvent, renderHook } from '@/test';
import { useEditorShortcuts } from './useEditorShortcuts';

function createMockEditor() {
  const dom = document.createElement('div');
  dom.setAttribute('contenteditable', 'true');
  document.body.appendChild(dom);

  const chain = {
    focus: vi.fn().mockReturnThis(),
    toggleBold: vi.fn().mockReturnThis(),
    toggleItalic: vi.fn().mockReturnThis(),
    toggleUnderline: vi.fn().mockReturnThis(),
    toggleHeading: vi.fn().mockReturnThis(),
    run: vi.fn().mockReturnValue(true),
  };

  const editor = {
    isFocused: false,
    view: { dom },
    chain: vi.fn(() => chain),
  } as unknown as Editor;

  return { editor, chain, dom };
}

describe('useEditorShortcuts', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('applies formatting and heading shortcuts while focused inside editor', () => {
    const { editor, chain, dom } = createMockEditor();
    renderHook(() => useEditorShortcuts(editor));

    fireEvent.keyDown(dom, { key: 'b', ctrlKey: true });
    fireEvent.keyDown(dom, { key: 'i', ctrlKey: true });
    fireEvent.keyDown(dom, { key: 'u', ctrlKey: true });
    fireEvent.keyDown(dom, { key: '1', ctrlKey: true });
    fireEvent.keyDown(dom, { key: '2', ctrlKey: true });
    fireEvent.keyDown(dom, { key: '3', ctrlKey: true });

    expect(chain.toggleBold).toHaveBeenCalled();
    expect(chain.toggleItalic).toHaveBeenCalled();
    expect(chain.toggleUnderline).toHaveBeenCalled();
    expect(chain.toggleHeading).toHaveBeenCalledWith({ level: 1 });
    expect(chain.toggleHeading).toHaveBeenCalledWith({ level: 2 });
    expect(chain.toggleHeading).toHaveBeenCalledWith({ level: 3 });
    expect(chain.run).toHaveBeenCalled();
  });

  it('does not trigger shortcuts outside editor target', () => {
    const { editor, chain } = createMockEditor();
    renderHook(() => useEditorShortcuts(editor));

    fireEvent.keyDown(window, { key: 'b', ctrlKey: true });
    fireEvent.keyDown(window, { key: '1', ctrlKey: true });

    expect(chain.toggleBold).not.toHaveBeenCalled();
    expect(chain.toggleHeading).not.toHaveBeenCalled();
  });

  it('cleans up listeners on unmount', () => {
    const { editor, chain, dom } = createMockEditor();
    const { unmount } = renderHook(() => useEditorShortcuts(editor));

    fireEvent.keyDown(dom, { key: 'b', ctrlKey: true });
    expect(chain.toggleBold).toHaveBeenCalledTimes(1);

    unmount();
    fireEvent.keyDown(dom, { key: 'b', ctrlKey: true });
    expect(chain.toggleBold).toHaveBeenCalledTimes(1);
  });
});

