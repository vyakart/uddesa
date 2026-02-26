import { expect, test } from '@playwright/test';
import { registerWebRuntimeGuards } from './support/webGuards';

registerWebRuntimeGuards();

function activeElementLabel() {
  const active = document.activeElement as HTMLElement | null;
  if (!active) {
    return null;
  }

  const ariaLabel = active.getAttribute('aria-label');
  if (ariaLabel) {
    return ariaLabel;
  }

  return active.textContent?.trim() || active.id || active.tagName.toLowerCase();
}

test('keyboard-only focus order follows visual order on shelf and overlays', async ({ page }) => {
  await page.goto('/');
  const mod = await page.evaluate(() =>
    navigator.platform.toUpperCase().includes('MAC') ? 'Meta' : 'Control'
  );

  const settingsButton = page.getByRole('button', { name: 'Settings' });
  await settingsButton.focus();
  await expect(settingsButton).toBeFocused();

  const expectedShelfOrder = [
    'Open Scratchpad',
    'Open Blackboard',
    'Open Personal Diary',
    'Open Drafts',
    'Open Long Drafts',
    'Open Academic Papers',
  ];

  for (const expected of expectedShelfOrder) {
    await page.keyboard.press('Tab');
    await expect.poll(() => page.evaluate(activeElementLabel)).toBe(expected);
  }

  await page.keyboard.press(`${mod}+,`);
  await expect(page.getByRole('dialog', { name: 'Settings' })).toBeVisible();

  await expect.poll(() => page.evaluate(activeElementLabel)).toBe('Close modal');

  await page.keyboard.press('Tab');
  await expect.poll(() => page.evaluate(activeElementLabel)).toBe('Appearance');

  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('tab', { name: 'Shortcuts' })).toBeFocused();

  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: 'Settings' })).not.toBeVisible();

  await page.keyboard.press(`${mod}+K`);
  const commandInput = page.getByRole('combobox', { name: 'Command search' });
  await expect(commandInput).toBeVisible();
  await expect(commandInput).toBeFocused();

  await page.keyboard.press('Shift+Tab');
  await expect(page.getByRole('option').last()).toBeFocused();

  await page.keyboard.press('Tab');
  await expect(commandInput).toBeFocused();

  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: 'Command palette' })).not.toBeVisible();
});

test('screen-reader spot-check via accessibility tree snapshots', async ({ page }) => {
  await page.goto('/');
  const mod = await page.evaluate(() =>
    navigator.platform.toUpperCase().includes('MAC') ? 'Meta' : 'Control'
  );

  await page.keyboard.press(`${mod}+,`);
  await expect(page.getByRole('dialog', { name: 'Settings' })).toBeVisible();

  let snapshot = await page.locator('body').ariaSnapshot();
  expect(snapshot).toContain('dialog "Settings"');
  expect(snapshot).toContain('tab "Appearance"');
  expect(snapshot).toContain('tab "Shortcuts"');

  await page.keyboard.press('Escape');

  await page.keyboard.press(`${mod}+K`);
  await expect(page.getByRole('dialog', { name: 'Command palette' })).toBeVisible();

  snapshot = await page.locator('body').ariaSnapshot();
  expect(snapshot).toContain('dialog "Command palette"');
  expect(snapshot).toContain('combobox "Command search"');
  expect(snapshot).toContain('listbox');

  await page.keyboard.press('Escape');
  await page.keyboard.press(`${mod}+4`);
  await expect(page.getByRole('button', { name: 'New Draft' })).toBeVisible();

  snapshot = await page.locator('body').ariaSnapshot();
  expect(snapshot).toContain('navigation "Drafts Navigation"');
  expect(snapshot).toContain('main');
  expect(snapshot).toContain('status');
});
