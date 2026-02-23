import { hasActiveModalDialog, isEditableTarget } from './keyboard';

describe('keyboard utils', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('returns false for non-HTMLElement targets', () => {
    expect(isEditableTarget(null)).toBe(false);
    expect(isEditableTarget({} as EventTarget)).toBe(false);
  });

  it('treats editable controls and editable markers as editable targets', () => {
    const input = document.createElement('input');
    const textarea = document.createElement('textarea');
    const select = document.createElement('select');
    const contentEditable = document.createElement('div');
    const proseMirror = document.createElement('div');
    const proseMirrorChild = document.createElement('span');
    const roleEditable = document.createElement('div');

    Object.defineProperty(contentEditable, 'isContentEditable', { value: true, configurable: true });
    proseMirror.className = 'ProseMirror';
    proseMirror.appendChild(proseMirrorChild);
    roleEditable.setAttribute('role', 'SearchBox');
    document.body.appendChild(proseMirror);

    expect(isEditableTarget(input)).toBe(true);
    expect(isEditableTarget(textarea)).toBe(true);
    expect(isEditableTarget(select)).toBe(true);
    expect(isEditableTarget(contentEditable)).toBe(true);
    expect(isEditableTarget(proseMirrorChild)).toBe(true);
    expect(isEditableTarget(roleEditable)).toBe(true);
  });

  it('returns false for non-editable elements', () => {
    const nonEditable = document.createElement('button');
    expect(isEditableTarget(nonEditable)).toBe(false);
  });

  it('detects active modal dialogs by role and aria-modal', () => {
    expect(hasActiveModalDialog()).toBe(false);

    const dialog = document.createElement('div');
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');
    document.body.appendChild(dialog);
    expect(hasActiveModalDialog()).toBe(true);

    dialog.setAttribute('aria-modal', 'false');
    expect(hasActiveModalDialog()).toBe(false);
  });
});
