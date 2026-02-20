const EDITABLE_ROLES = new Set(['textbox', 'searchbox', 'combobox']);

export function isEditableTarget(target: EventTarget | null): target is HTMLElement {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  const role = target.getAttribute('role');

  return (
    target.tagName === 'INPUT' ||
    target.tagName === 'TEXTAREA' ||
    target.tagName === 'SELECT' ||
    target.isContentEditable ||
    target.closest('.ProseMirror') instanceof HTMLElement ||
    (role !== null && EDITABLE_ROLES.has(role.toLowerCase()))
  );
}

export function hasActiveModalDialog(): boolean {
  return Boolean(document.querySelector('[role="dialog"][aria-modal="true"]'));
}
