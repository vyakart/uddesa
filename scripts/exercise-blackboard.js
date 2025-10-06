import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  page.on('console', (msg) => {
    console.log('[browser]', msg.text());
  });
  try {
    await page.goto('http://127.0.0.1:4175/', { waitUntil: 'networkidle' });
    await page.waitForSelector('text=Notebook Shelf');
    await page.click('summary:has-text("New diary")');
    await page.click('button:has-text("Blackboard")');
    await page.waitForSelector('.blackboard');

    await page.waitForTimeout(500);
    const windowKeys = await page.evaluate(() => Object.keys(window));
    console.log('window keys sample', windowKeys.slice(0, 20));

    await page.waitForSelector('.excalidraw');

    await page.keyboard.press('KeyT');
    await page.mouse.click(900, 500);
    await page.keyboard.type('# Plan Outline');
    await page.keyboard.press('Control+Enter');

    await page.keyboard.press('KeyT');
    await page.mouse.click(900, 650);
    await page.keyboard.type('Sprint Goals');
    await page.keyboard.press('Control+Enter');

    await page.waitForTimeout(500);

    const outlineItems = await page.$$eval('.outline-panel__item', (items) =>
      items.map((item) => ({
        text: item.textContent?.trim(),
        classes: item.className,
      })),
    );
    console.log('outline items', outlineItems);

    const countText = await page.textContent('.outline-panel__count');
    console.log('outline count', countText);

    if (outlineItems.length >= 2) {
      await page.click(`.outline-panel__item:nth-child(2) button`);
      await page.waitForTimeout(500);
    }

    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForSelector('.blackboard');
    await page.waitForTimeout(500);
    const outlineItemsAfterReload = await page.$$eval('.outline-panel__item', (items) =>
      items.map((item) => item.textContent?.trim()),
    );
    console.log('outline after reload', outlineItemsAfterReload);
  } catch (err) {
    console.error('Test failed', err);
  } finally {
    await browser.close();
  }
})();
