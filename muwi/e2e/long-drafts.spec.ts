import { expect, test } from '@playwright/test';

test('long drafts flow: create document, add sections, reorder sections', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('button', { name: 'Open Long Drafts' }).click();
  await expect(page.getByRole('heading', { name: 'Long Drafts' })).toBeVisible();

  await page.getByRole('button', { name: 'Create New Document' }).click();
  await expect(page.getByRole('button', { name: /Untitled Document/i })).toBeVisible();

  await page.getByRole('button', { name: 'Add Section' }).click();
  await expect(page.getByPlaceholder('Section Title')).toBeVisible();
  await page.getByPlaceholder('Section Title').fill('First Section');
  await expect(page.locator('[data-testid="long-drafts-toc"] span[title="First Section"]')).toBeVisible();

  await page.getByRole('button', { name: 'Add Section' }).click();
  await expect(page.locator('[data-testid="long-drafts-toc"] span[title="Untitled Section"]')).toBeVisible();

  const secondRow = page
    .locator('[data-testid="long-drafts-toc"] span[title="Untitled Section"]')
    .locator('xpath=ancestor::div[@draggable="true"][1]');
  const firstRow = page
    .locator('[data-testid="long-drafts-toc"] span[title="First Section"]')
    .locator('xpath=ancestor::div[@draggable="true"][1]');
  await secondRow.dragTo(firstRow);

  await expect
    .poll(async () => {
      return page
        .locator('[data-testid="long-drafts-toc"] .muwi-longdrafts-toc__item-label')
        .evaluateAll((nodes) => nodes.slice(0, 2).map((node) => node.textContent?.trim() ?? ''));
    })
    .toEqual(['Untitled Section', 'First Section']);
});
