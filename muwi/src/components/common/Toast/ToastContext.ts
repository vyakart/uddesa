import { createContext, type ReactNode } from 'react';
import { type ToastVariant } from './Toast';

export interface ToastInput {
  message: string;
  title?: string;
  variant?: ToastVariant;
  duration?: number;
  icon?: ReactNode;
}

export interface ToastRecord extends ToastInput {
  id: string;
}

export interface ToastContextValue {
  toasts: ToastRecord[];
  showToast: (toast: ToastInput) => string;
  dismissToast: (id: string) => void;
  clearToasts: () => void;
}

export const ToastContext = createContext<ToastContextValue | null>(null);
