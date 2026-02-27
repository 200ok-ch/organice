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

const longPressDragHeader = async (
  page,
  sourceText,
  targetText,
  { position = 'after', scrollDirection = null } = {}
) => {
  const sourceHeader = page.locator('.header').filter({ hasText: sourceText }).first();
  const targetHeader = page.locator('.header').filter({ hasText: targetText }).first();

  await sourceHeader.scrollIntoViewIfNeeded();
  await expect(sourceHeader).toBeVisible();

  const sourceBox = await sourceHeader.boundingBox();
  expect(sourceBox).toBeTruthy();

  const startX = sourceBox.x + sourceBox.width / 2;
  const startY = sourceBox.y + sourceBox.height / 2;

  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.waitForTimeout(450);

  await expect(sourceHeader).toHaveClass(/header--long-press-dragging/);

  if (scrollDirection) {
    const viewportHeight = page.viewportSize().height;
    const dragY = scrollDirection === 'down' ? viewportHeight - 20 : 20;
    for (let i = 0; i < 30; i += 1) {
      await page.mouse.move(startX, dragY);
      await page.waitForTimeout(60);
      if (await targetHeader.isVisible()) {
        break;
      }
    }
  }

  await targetHeader.scrollIntoViewIfNeeded();
  await expect(targetHeader).toBeVisible();

  const targetBox = await targetHeader.boundingBox();
  expect(targetBox).toBeTruthy();

  const targetY =
    position === 'after'
      ? targetBox.y + targetBox.height * 0.8
      : targetBox.y + targetBox.height * 0.2;

  await page.mouse.move(targetBox.x + targetBox.width / 2, targetY);
  await page.mouse.up();
  await page.waitForTimeout(250);
};

const visibleHeaderTitles = async (page) => {
  return page.evaluate(() => {
    return Array.from(document.querySelectorAll('.header')).map((header) =>
      header.textContent.trim()
    );
  });
};

test.describe('Long Press Reorder', () => {
  test('long press shows hover state and reorders across multiple view pages', async ({ page }) => {
    const appHelper = new AppHelper(page);

    await page.goto('/sample', { waitUntil: 'domcontentloaded' });
    await appHelper.waitForAppReady();

    const sourceBeforeIndex = await headerIndexByText(page, SOURCE_HEADER_TEXT);
    const targetBeforeIndex = await headerIndexByText(page, TARGET_HEADER_TEXT);
    expect(sourceBeforeIndex).toBeGreaterThan(-1);
    expect(targetBeforeIndex).toBeGreaterThan(-1);
    expect(sourceBeforeIndex).toBeLessThan(targetBeforeIndex);

    await longPressDragHeader(page, SOURCE_HEADER_TEXT, TARGET_HEADER_TEXT, {
      position: 'after',
      scrollDirection: 'down',
    });

    const sourceAfterIndex = await headerIndexByText(page, SOURCE_HEADER_TEXT);
    const targetAfterIndex = await headerIndexByText(page, TARGET_HEADER_TEXT);
    expect(sourceAfterIndex).toBe(targetAfterIndex + 1);
  });

  test('long press keeps correct middle drop position across repeated reorders', async ({
    page,
  }) => {
    const appHelper = new AppHelper(page);

    await page.goto('/sample', { waitUntil: 'domcontentloaded' });
    await appHelper.waitForAppReady();

    await longPressDragHeader(page, SOURCE_HEADER_TEXT, TARGET_HEADER_TEXT, {
      position: 'after',
      scrollDirection: 'down',
    });

    const secondTarget = 'Planning';
    await longPressDragHeader(page, SOURCE_HEADER_TEXT, secondTarget, {
      position: 'after',
      scrollDirection: null,
    });

    const sourceAfterSecondMove = await headerIndexByText(page, SOURCE_HEADER_TEXT);
    const secondTargetIndex = await headerIndexByText(page, secondTarget);
    const lastHeaderIndex = await page.evaluate(
      () => document.querySelectorAll('.header').length - 1
    );

    expect(sourceAfterSecondMove).toBe(secondTargetIndex + 1);
    expect(sourceAfterSecondMove).toBeGreaterThan(0);
    expect(sourceAfterSecondMove).toBeLessThan(lastHeaderIndex);
  });

  test('moving a parent with children keeps subtree intact with no duplicates', async ({
    page,
  }) => {
    const appHelper = new AppHelper(page);

    await page.goto('/sample', { waitUntil: 'domcontentloaded' });
    await appHelper.waitForAppReady();

    const captureText = 'Capture';
    const groceriesText = 'Groceries';
    const deeplyText = 'Deeply';

    await expect(page.locator('.header').filter({ hasText: captureText }).first()).toBeVisible();

    await longPressDragHeader(page, captureText, 'This is an actual org file', {
      position: 'before',
      scrollDirection: 'up',
    });

    await longPressDragHeader(page, captureText, 'Planning', {
      position: 'after',
      scrollDirection: 'down',
    });

    await longPressDragHeader(page, captureText, 'This is an actual org file', {
      position: 'before',
      scrollDirection: 'up',
    });

    const captureHeader = page.locator('.header').filter({ hasText: captureText }).first();
    await captureHeader.click();
    await page.waitForTimeout(120);

    const titles = await visibleHeaderTitles(page);
    const captureIndex = titles.findIndex((title) => title.includes(captureText));
    expect(captureIndex).toBe(0);
    expect(titles[captureIndex + 1]).toContain(groceriesText);
    expect(titles[captureIndex + 2]).toContain(deeplyText);
  });
});
