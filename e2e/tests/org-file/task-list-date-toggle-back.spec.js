import { test, expect } from '@playwright/test';
import AppHelper from '../../helpers/app-helper.js';

test.describe('Task List Date Toggle Back', () => {
  let appHelper;

  test.beforeEach(async ({ page }) => {
    appHelper = new AppHelper(page);

    await page.goto('/sample', { waitUntil: 'domcontentloaded' });
    await appHelper.waitForAppReady();
  });

  test('clicking date twice toggles relative and back to absolute format', async ({ page }) => {
    await page.getByTitle('Show Search / Task List').click();
    await page.locator('.tab-buttons__btn', { hasText: 'Task List' }).first().click();

    const planningDate = page.locator('.task-list__header-planning-date').first();
    await expect(planningDate).toBeVisible();

    const absoluteValue = (await planningDate.innerText()).trim();
    expect(absoluteValue).toMatch(/^\d{2}\/\d{2}$/);

    await planningDate.click();
    const relativeValue = (await planningDate.innerText()).trim();
    expect(relativeValue).not.toBe(absoluteValue);

    await planningDate.click();
    const absoluteAgain = (await planningDate.innerText()).trim();
    expect(absoluteAgain).toMatch(/^\d{2}\/\d{2}$/);
  });
});
