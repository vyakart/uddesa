import { renderHook } from '@/test';
import { usePasteHandler } from './usePasteHandler';

function firePaste(target: HTMLElement, text: string): Event {
  const event = new Event('paste', { bubbles: true, cancelable: true });
  Object.defineProperty(event, 'clipboardData', {
    value: {
      getData: (type: string) => {
        if (type === 'text/plain' || type === 'text') {
          return text;
        }
        return '';
      },
    },
  });

  target.dispatchEvent(event);
  return event;
}

function setCaretToEnd(element: HTMLElement) {
  const selection = window.getSelection();
  const range = document.createRange();
  range.selectNodeContents(element);
  range.collapse(false);
  selection?.removeAllRanges();
  selection?.addRange(range);
}

describe('usePasteHandler', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    window.getSelection()?.removeAllRanges();
  });

  it('intercepts paste and inserts plain text into text inputs', () => {
    renderHook(() => usePasteHandler());

    const textarea = document.createElement('textarea');
    textarea.value = 'Hello ';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.setSelectionRange(6, 6);

    const event = firePaste(textarea, 'World\r\nAgain');

    expect(event.defaultPrevented).toBe(true);
    expect(textarea.value).toBe('Hello World\nAgain');
  });

  it('intercepts paste on contentEditable targets and preserves line breaks', () => {
    renderHook(() => usePasteHandler());

    const editable = document.createElement('div');
    editable.contentEditable = 'true';
    editable.setAttribute('contenteditable', 'true');
    editable.textContent = 'Start ';
    document.body.appendChild(editable);
    setCaretToEnd(editable);

    const event = firePaste(editable, 'Alpha\r\nBeta');

    expect(event.defaultPrevented).toBe(true);
    expect(editable.textContent).toContain('Start Alpha\nBeta');
  });

  it('supports nested TipTap/ProseMirror-like targets', () => {
    renderHook(() => usePasteHandler());

    const root = document.createElement('div');
    root.className = 'ProseMirror';
    root.setAttribute('contenteditable', 'true');
    root.textContent = 'Doc ';
    const child = document.createElement('span');
    child.textContent = 'body';
    root.appendChild(child);
    document.body.appendChild(root);
    setCaretToEnd(root);

    const event = firePaste(child, ' plain');

    expect(event.defaultPrevented).toBe(true);
    expect(root.textContent).toContain('Doc body plain');
  });

  it('does nothing for non-editable targets', () => {
    renderHook(() => usePasteHandler());

    const nonEditable = document.createElement('div');
    nonEditable.textContent = 'Not editable';
    document.body.appendChild(nonEditable);

    const event = firePaste(nonEditable, 'ignored');

    expect(event.defaultPrevented).toBe(false);
    expect(nonEditable.textContent).toBe('Not editable');
  });
});
