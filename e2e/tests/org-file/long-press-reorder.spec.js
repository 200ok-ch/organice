import { test, expect } from '@playwright/test';
import AppHelper from '../../helpers/app-helper.js';

const SOURCE_HEADER_TEXT = 'Automatic/Implicit links';
const TARGET_HEADER_TEXT = 'Further questions?';

const headerIndexByText = async (page, text) => {
  return page.evaluate((headerText) => {
    const headers = Array.from(document.querySelectorAll('.header'));
    return headers.findIndex((header) => header.textContent.includes(headerText));
  }, text);
};

test.describe('Long Press Reorder', () => {
  test('long press shows hover state and reorders across multiple view pages', async ({ page }) => {
    const appHelper = new AppHelper(page);

    await page.goto('/sample', { waitUntil: 'domcontentloaded' });
    await appHelper.waitForAppReady();

    const sourceHeader = page.locator('.header').filter({ hasText: SOURCE_HEADER_TEXT }).first();
    const targetHeader = page.locator('.header').filter({ hasText: TARGET_HEADER_TEXT }).first();

    await sourceHeader.scrollIntoViewIfNeeded();
    await expect(sourceHeader).toBeVisible();

    const sourceBeforeIndex = await headerIndexByText(page, SOURCE_HEADER_TEXT);
    const targetBeforeIndex = await headerIndexByText(page, TARGET_HEADER_TEXT);
    expect(sourceBeforeIndex).toBeGreaterThan(-1);
    expect(targetBeforeIndex).toBeGreaterThan(-1);
    expect(sourceBeforeIndex).toBeLessThan(targetBeforeIndex);

    const sourceBox = await sourceHeader.boundingBox();
    expect(sourceBox).toBeTruthy();

    const startX = sourceBox.x + sourceBox.width / 2;
    const startY = sourceBox.y + sourceBox.height / 2;

    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.waitForTimeout(450);

    await expect(sourceHeader).toHaveClass(/header--long-press-dragging/);

    const viewportHeight = page.viewportSize().height;
    const dragY = viewportHeight - 20;
    for (let i = 0; i < 30; i += 1) {
      await page.mouse.move(startX, dragY);
      await page.waitForTimeout(60);
      if (await targetHeader.isVisible()) {
        break;
      }
    }

    await targetHeader.scrollIntoViewIfNeeded();
    await expect(targetHeader).toBeVisible();

    const targetBox = await targetHeader.boundingBox();
    expect(targetBox).toBeTruthy();

    await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height * 0.8);
    await page.mouse.up();
    await page.waitForTimeout(250);

    const sourceAfterIndex = await headerIndexByText(page, SOURCE_HEADER_TEXT);
    const targetAfterIndex = await headerIndexByText(page, TARGET_HEADER_TEXT);
    expect(sourceAfterIndex).toBe(targetAfterIndex + 1);
  });
});
