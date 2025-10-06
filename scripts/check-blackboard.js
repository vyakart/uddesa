import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  page.on('console', (msg) => console.log('[browser]', msg.type(), msg.text()));
  try {
    await page.goto('http://127.0.0.1:4175/', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('text=Notebook Shelf');
    await page.click('summary:has-text("New diary")');
    await page.click('button:has-text("Blackboard")');
    await page.waitForTimeout(4000);
    const content = await page.content();
    console.log(content.slice(0, 500));
    await page.screenshot({ path: 'blackboard.png', fullPage: true });
  } catch (err) {
    console.error('fail', err);
  } finally {
    await page.close();
    await browser.close();
  }
})();
