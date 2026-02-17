import { useEffect } from 'react';

interface UsePasteHandlerOptions {
  enabled?: boolean;
}

type TextInputElement = HTMLInputElement | HTMLTextAreaElement;

function isTextInputElement(element: HTMLElement): element is TextInputElement {
  if (element instanceof HTMLTextAreaElement) {
    return true;
  }

  if (!(element instanceof HTMLInputElement)) {
    return false;
  }

  const unsupportedTypes = new Set([
    'button',
    'checkbox',
    'color',
    'file',
    'hidden',
    'image',
    'radio',
    'range',
    'reset',
    'submit',
  ]);

  return !unsupportedTypes.has(element.type);
}

function getEditableElement(target: EventTarget | null): HTMLElement | null {
  if (!(target instanceof HTMLElement)) {
    return null;
  }

  const hasContentEditableAttribute =
    target.getAttribute('contenteditable') === 'true' || target.getAttribute('contenteditable') === '';

  if (isTextInputElement(target) || target.isContentEditable || hasContentEditableAttribute) {
    return target;
  }

  const editableParent = target.closest('[contenteditable="true"], [contenteditable=""], .ProseMirror');
  return editableParent instanceof HTMLElement ? editableParent : null;
}

function normalizeLineBreaks(value: string): string {
  return value.replace(/\r\n?/g, '\n');
}

function insertIntoTextInput(element: TextInputElement, text: string): void {
  const start = element.selectionStart ?? element.value.length;
  const end = element.selectionEnd ?? start;

  element.setRangeText(text, start, end, 'end');
  element.dispatchEvent(new Event('input', { bubbles: true }));
}

function insertIntoContentEditable(element: HTMLElement, text: string): void {
  const doc = element.ownerDocument ?? document;

  if (typeof doc.execCommand === 'function' && doc.execCommand('insertText', false, text)) {
    return;
  }

  const selection = doc.defaultView?.getSelection() ?? window.getSelection();
  if (!selection || selection.rangeCount === 0) {
    element.textContent = `${element.textContent ?? ''}${text}`;
    return;
  }

  const range = selection.getRangeAt(0);
  range.deleteContents();

  const textNode = doc.createTextNode(text);
  range.insertNode(textNode);
  range.setStartAfter(textNode);
  range.collapse(true);

  selection.removeAllRanges();
  selection.addRange(range);
  element.dispatchEvent(new Event('input', { bubbles: true }));
}

function insertPlainText(element: HTMLElement, text: string): void {
  if (isTextInputElement(element)) {
    insertIntoTextInput(element, text);
    return;
  }

  insertIntoContentEditable(element, text);
}

export function usePasteHandler(options: UsePasteHandlerOptions = {}) {
  const { enabled = true } = options;

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const handlePaste = (event: ClipboardEvent) => {
      const editableElement = getEditableElement(event.target);
      if (!editableElement || !event.clipboardData) {
        return;
      }

      const plainText = normalizeLineBreaks(
        event.clipboardData.getData('text/plain') || event.clipboardData.getData('text')
      );

      event.preventDefault();
      insertPlainText(editableElement, plainText);
    };

    document.addEventListener('paste', handlePaste, true);
    return () => {
      document.removeEventListener('paste', handlePaste, true);
    };
  }, [enabled]);
}
