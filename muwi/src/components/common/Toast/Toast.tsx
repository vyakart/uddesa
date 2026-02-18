import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';

export type ToastVariant = 'success' | 'warning' | 'error' | 'info';

const DEFAULT_DURATION = 4000;

export interface ToastProps {
  id: string;
  message: string;
  title?: string;
  variant?: ToastVariant;
  duration?: number;
  icon?: ReactNode;
  onClose: (id: string) => void;
}

function getVariantIcon(variant: ToastVariant): string {
  switch (variant) {
    case 'success':
      return '✓';
    case 'warning':
      return '!';
    case 'error':
      return '×';
    case 'info':
    default:
      return 'i';
  }
}

export function Toast({
  id,
  message,
  title,
  variant = 'info',
  duration = DEFAULT_DURATION,
  icon,
  onClose,
}: ToastProps) {
  const timerRef = useRef<number | null>(null);
  const remainingRef = useRef(duration);
  const startedAtRef = useRef(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isFocusWithin, setIsFocusWithin] = useState(false);

  const isPaused = isHovered || isFocusWithin;

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    if (duration <= 0) {
      return;
    }

    clearTimer();

    if (remainingRef.current <= 0) {
      onClose(id);
      return;
    }

    startedAtRef.current = Date.now();
    timerRef.current = window.setTimeout(() => {
      onClose(id);
    }, remainingRef.current);
  }, [clearTimer, duration, id, onClose]);

  const pauseTimer = useCallback(() => {
    if (duration <= 0 || timerRef.current === null) {
      return;
    }

    const elapsed = Date.now() - startedAtRef.current;
    remainingRef.current = Math.max(0, remainingRef.current - elapsed);
    clearTimer();
  }, [clearTimer, duration]);

  useEffect(() => {
    if (duration <= 0) {
      return;
    }

    if (isPaused) {
      pauseTimer();
      return;
    }

    startTimer();

    return () => {
      clearTimer();
    };
  }, [clearTimer, duration, isPaused, pauseTimer, startTimer]);

  useEffect(() => {
    remainingRef.current = duration;
  }, [duration]);

  return (
    <div
      role="status"
      aria-live="polite"
      className="muwi-toast"
      data-variant={variant}
      data-testid={`toast-${id}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsFocusWithin(true)}
      onBlur={(event) => {
        if (event.currentTarget.contains(event.relatedTarget as Node)) {
          return;
        }
        setIsFocusWithin(false);
      }}
    >
      <span className="muwi-toast__icon" aria-hidden="true">
        {icon ?? getVariantIcon(variant)}
      </span>
      <div className="muwi-toast__content">
        {title ? <p className="muwi-toast__title">{title}</p> : null}
        <p className="muwi-toast__message">{message}</p>
      </div>
      <button
        type="button"
        className="muwi-toast__close"
        aria-label="Dismiss notification"
        onClick={() => onClose(id)}
      >
        ×
      </button>
    </div>
  );
}
