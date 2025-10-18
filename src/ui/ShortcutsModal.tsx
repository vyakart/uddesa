import { useEffect, useState } from 'react';
import { shortcuts, formatShortcut, type Shortcut } from '../services/shortcuts';

export interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Modal displaying all available keyboard shortcuts
 */
export function ShortcutsModal({ isOpen, onClose }: ShortcutsModalProps) {
  const [allShortcuts, setAllShortcuts] = useState<Shortcut[]>([]);

  useEffect(() => {
    if (isOpen) {
      setAllShortcuts(shortcuts.getShortcuts());
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  const globalShortcuts = allShortcuts.filter((s) => s.context === 'global' || !s.context);
  const editorShortcuts = allShortcuts.filter((s) => s.context === 'editor');

  return (
    <div
      id="shortcuts-modal"
      className="modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcuts-title"
    >
      <div className="modal-content shortcuts-modal" onClick={(e) => e.stopPropagation()}>
        <header className="modal-header">
          <h2 id="shortcuts-title">Keyboard Shortcuts</h2>
          <button
            className="modal-close"
            onClick={onClose}
            aria-label="Close shortcuts modal"
          >
            ✕
          </button>
        </header>

        <div className="modal-body">
          {globalShortcuts.length > 0 && (
            <section className="shortcuts-section">
              <h3>Global Shortcuts</h3>
              <dl className="shortcuts-list">
                {globalShortcuts.map((shortcut, index) => (
                  <div key={index} className="shortcuts-item">
                    <dt className="shortcuts-key">
                      <kbd>{formatShortcut(shortcut)}</kbd>
                    </dt>
                    <dd className="shortcuts-description">{shortcut.description}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}

          {editorShortcuts.length > 0 && (
            <section className="shortcuts-section">
              <h3>Editor Shortcuts</h3>
              <dl className="shortcuts-list">
                {editorShortcuts.map((shortcut, index) => (
                  <div key={index} className="shortcuts-item">
                    <dt className="shortcuts-key">
                      <kbd>{formatShortcut(shortcut)}</kbd>
                    </dt>
                    <dd className="shortcuts-description">{shortcut.description}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}
        </div>

        <footer className="modal-footer">
          <button className="modal-button" onClick={onClose}>
            Close
          </button>
        </footer>
      </div>
    </div>
  );
}
