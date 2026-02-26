import { expect, test } from '@playwright/test';
import { registerWebRuntimeGuards } from './support/webGuards';

registerWebRuntimeGuards();

test('shelf renders all diary cards', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'MUWI' })).toBeVisible();
  await expect(page.getByText('⌘K to open command palette')).toBeVisible();

  await expect(page.getByRole('button', { name: 'Open Scratchpad' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Open Blackboard' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Open Personal Diary' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Open Drafts' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Open Long Drafts' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Open Academic Papers' })).toBeVisible();
});

test('resize smoke: sidebar and right panel adapt across desktop and narrow widths', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/');

  await page.getByRole('button', { name: 'Open Long Drafts' }).click();
  await page.getByRole('button', { name: 'Create New Document' }).click();

  const sidebarShell = page.locator('[data-testid="shared-sidebar-shell"]');
  const diaryShell = page.locator('[data-testid="diary-shell"]');

  await expect(sidebarShell).toHaveAttribute('data-open', 'true');
  await expect(diaryShell).toHaveAttribute('data-shell-breakpoint', 'wide');

  await page.getByRole('button', { name: 'TOC Panel' }).click();
  await expect(page.getByRole('complementary', { name: 'Table of Contents panel' })).toBeVisible();
  await expect(sidebarShell).toHaveAttribute('data-open', 'true');

  await page.setViewportSize({ width: 900, height: 900 });
  await expect(diaryShell).toHaveAttribute('data-shell-breakpoint', 'compact');
  await expect(sidebarShell).toHaveAttribute('data-open', 'false');

  await page.setViewportSize({ width: 760, height: 900 });
  await expect(diaryShell).toHaveAttribute('data-shell-breakpoint', 'overlay');
  await expect(diaryShell).toHaveAttribute('data-sidebar-overlay', 'true');

  await page.getByRole('button', { name: 'Expand sidebar' }).click();
  await expect(page.getByRole('button', { name: 'Close sidebar overlay' })).toBeVisible();
  await expect(sidebarShell).toHaveAttribute('data-open', 'true');

  await page.getByRole('button', { name: 'Close sidebar overlay' }).click();
  await expect(sidebarShell).toHaveAttribute('data-open', 'false');
});
