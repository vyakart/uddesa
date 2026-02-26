import { expect, test } from '@playwright/test';
import type { ConsoleMessage, Page } from '@playwright/test';

interface GuardState {
  pageErrors: string[];
  consoleErrors: string[];
}

const pageGuardState = new WeakMap<Page, GuardState>();

function serializeConsoleMessage(message: ConsoleMessage): string {
  return `${message.type()}: ${message.text()}`;
}

function shouldIgnoreConsoleError(message: ConsoleMessage): boolean {
  if (message.type() !== 'error') {
    return false;
  }

  const text = message.text();
  if (
    text.includes("The Content Security Policy directive 'frame-ancestors' is ignored when delivered via") &&
    (text.includes('<meta> element') || text.includes('an HTML meta element'))
  ) {
    return true;
  }

  if (
    text.includes('https://esm.sh/@excalidraw/excalidraw') &&
    (text.includes('font-src') || text.includes('(font-src)'))
  ) {
    return true;
  }

  if (
    (
      (text.includes("Can't call %s on a component that is not yet mounted.") && text.includes('setState _App')) ||
      (text.includes("Can't call setState on a component that is not yet mounted.") && text.includes('_App component'))
    )
  ) {
    return true;
  }

  if (text.includes('Content-Security-Policy: Prevented too many CSP reports from being sent within a short period of time')) {
    return true;
  }

  return false;
}

export function registerWebRuntimeGuards(): void {
  test.beforeEach(async ({ page }) => {
    const state: GuardState = {
      pageErrors: [],
      consoleErrors: [],
    };

    pageGuardState.set(page, state);

    page.on('pageerror', (error) => {
      state.pageErrors.push(error.stack || error.message);
    });

    page.on('console', (message) => {
      if (message.type() === 'error' && !shouldIgnoreConsoleError(message)) {
        state.consoleErrors.push(serializeConsoleMessage(message));
      }
    });
  });

  test.afterEach(async ({ page }, testInfo) => {
    const state = pageGuardState.get(page);
    if (!state) {
      return;
    }

    if (state.pageErrors.length > 0 || state.consoleErrors.length > 0) {
      await testInfo.attach('runtime-errors.json', {
        body: JSON.stringify(state, null, 2),
        contentType: 'application/json',
      });
    }

    expect(
      state.pageErrors,
      `Unexpected page errors:\n${state.pageErrors.join('\n\n')}`
    ).toEqual([]);
    expect(
      state.consoleErrors,
      `Unexpected console errors:\n${state.consoleErrors.join('\n')}`
    ).toEqual([]);
  });
}
