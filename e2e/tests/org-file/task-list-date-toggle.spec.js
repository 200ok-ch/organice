import { test, expect } from '@playwright/test';
import AppHelper from '../../helpers/app-helper.js';

test.describe('Task List Date Toggle', () => {
  let appHelper;

  test.beforeEach(async ({ page }) => {
    appHelper = new AppHelper(page);

    await page.goto('/sample', { waitUntil: 'domcontentloaded' });
    await appHelper.waitForAppReady();
  });

  test('clicking a task date toggles absolute and relative display', async ({ page }) => {
    await page.getByTitle('Show Search / Task List').click();
    await page.locator('.tab-buttons__btn', { hasText: 'Task List' }).first().click();

    const firstPlanningDate = page.locator('.task-list__header-planning-date').first();
    await expect(firstPlanningDate).toBeVisible();

    const absoluteValue = (await firstPlanningDate.innerText()).trim();
    expect(absoluteValue).toMatch(/^\d{2}\/\d{2}$/);

    await firstPlanningDate.click();

    const relativeValue = (await firstPlanningDate.innerText()).trim();
    expect(relativeValue).not.toBe(absoluteValue);
    expect(relativeValue).toMatch(/[a-zA-Z]/);
  });
});
