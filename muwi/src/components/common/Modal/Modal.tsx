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
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useEffect(() => {
    if (!isOpen) {
      return;
    }

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
    };
  }, [closeOnEscape, initialFocusRef, isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return createPortal(
    <div
      data-testid="modal-backdrop"
      onMouseDown={(event) => {
        if (closeOnBackdropClick && event.target === event.currentTarget) {
          onClose();
        }
      }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        backgroundColor: 'rgba(0, 0, 0, 0.45)',
        opacity: 1,
        transition: 'opacity 180ms ease',
        animation: 'muwi-fade-in 180ms ease',
      }}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        tabIndex={-1}
        className={className}
        style={{
          width: '100%',
          maxWidth,
          maxHeight: '90vh',
          overflow: 'auto',
          borderRadius: 12,
          border: '1px solid #d8d8d8',
          backgroundColor: '#fffef9',
          boxShadow: '0 12px 40px rgba(0, 0, 0, 0.2)',
          transform: 'translateY(0)',
          transition: 'transform 180ms ease, opacity 180ms ease',
          animation: 'muwi-modal-in 180ms ease',
        }}
      >
        {title ? (
          <header
            style={{
              padding: '1rem 1.25rem',
              borderBottom: '1px solid #ececec',
            }}
          >
            <h2 id={titleId} style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600 }}>
              {title}
            </h2>
          </header>
        ) : null}

        <div style={{ padding: '1.25rem' }}>{children}</div>
      </div>
    </div>,
    document.body
  );
}
