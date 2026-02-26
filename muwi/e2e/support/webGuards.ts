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
      if (message.type() === 'error') {
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
