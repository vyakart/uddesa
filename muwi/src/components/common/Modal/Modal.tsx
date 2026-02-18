import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';

const FOCUSABLE_SELECTOR =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

export interface ModalProps {
  isOpen: boolean;
  title?: string;
  children: React.ReactNode;
  onClose: () => void;
  closeOnBackdropClick?: boolean;
  closeOnEscape?: boolean;
  initialFocusRef?: React.RefObject<HTMLElement | null>;
  className?: string;
  maxWidth?: number;
  closeButtonLabel?: string;
}

export function Modal({
  isOpen,
  title,
  children,
  onClose,
  closeOnBackdropClick = true,
  closeOnEscape = true,
  initialFocusRef,
  className,
  maxWidth = 720,
  closeButtonLabel = 'Close modal',
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const titleId = useId();

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    returnFocusRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const modalNode = modalRef.current;
    if (!modalNode) {
      return;
    }

    const focusables = modalNode.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
    const firstFocusable = focusables[0];
    const target = initialFocusRef?.current ?? firstFocusable ?? modalNode;
    target.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && closeOnEscape) {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== 'Tab') {
        return;
      }

      const nodes = modalNode.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
      if (nodes.length === 0) {
        event.preventDefault();
        modalNode.focus();
        return;
      }

      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      const activeElement = document.activeElement as HTMLElement | null;

      if (!event.shiftKey && activeElement === last) {
        event.preventDefault();
        first.focus();
      } else if (event.shiftKey && activeElement === first) {
        event.preventDefault();
        last.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);

      const focusTarget = returnFocusRef.current;
      if (focusTarget && document.contains(focusTarget)) {
        focusTarget.focus();
      }
      returnFocusRef.current = null;
    };
  }, [closeOnEscape, initialFocusRef, isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return createPortal(
    <div
      className="muwi-modal-backdrop"
      data-testid="modal-backdrop"
      onMouseDown={(event) => {
        if (closeOnBackdropClick && event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        tabIndex={-1}
        className={['muwi-modal', className ?? null].filter(Boolean).join(' ')}
        style={{ maxWidth }}
      >
        <header className="muwi-modal__header" data-has-title={title ? 'true' : 'false'}>
          {title ? (
            <h2 id={titleId} className="muwi-modal__title">
              {title}
            </h2>
          ) : (
            <span aria-hidden="true" />
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label={closeButtonLabel}
            className="muwi-button"
            data-variant="ghost"
            data-size="sm"
            data-icon-only="true"
            data-active="false"
            data-testid="modal-close-button"
          >
            ×
          </button>
        </header>

        <div className="muwi-modal__body">{children}</div>
      </div>
    </div>,
    document.body
  );
}
