import type { ReactElement, ReactNode } from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

interface AllTheProvidersProps {
  children: ReactNode;
}

function AllTheProviders({ children }: AllTheProvidersProps) {
  // Add providers here as the app grows (e.g., React Query, Router, etc.)
  return <>{children}</>;
}

const customRender = (ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) =>
  render(ui, { wrapper: AllTheProviders, ...options });

// re-export everything
export * from '@testing-library/react';

// override render method
export { customRender as render };

// Setup user-event with default options
export const setupUser = () => userEvent.setup();

// Helper to wait for async state updates
export const waitForState = () => new Promise((resolve) => setTimeout(resolve, 0));
