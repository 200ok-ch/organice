import { test, expect } from '@playwright/test';
import AppHelper from '../../helpers/app-helper.js';
import FirefoxHelper from '../../helpers/firefox-helper.js';

test.describe('Narrowing with Task List', () => {
  let appHelper;
  let firefoxHelper;

  test.beforeEach(async ({ page }) => {
    appHelper = new AppHelper(page);
    firefoxHelper = new FirefoxHelper(page);

    await page.goto('/sample', { waitUntil: 'domcontentloaded' });
    await appHelper.waitForAppReady();
  });

  test('task list is scoped to a narrowed header subtree', async ({ page }) => {
    const actionsHeader = page.locator('.header').filter({ hasText: 'Actions' }).first();
    await actionsHeader.scrollIntoViewIfNeeded();
    await actionsHeader.click();

    await expect(page.locator('[data-testid="header-action-drawer"]')).toBeVisible();
    await firefoxHelper.clickClickCatcherButton('header-action-narrow');

    await page.getByTitle('Show Search / Task List').click();
    await page.locator('.tab-buttons__btn', { hasText: 'Task List' }).first().click();

    const drawer = page.locator('[data-testid="drawer"]');
    await expect(drawer).toContainText('Investigate custom TODO states');
    await expect(drawer).not.toContainText('Check out the organice agenda view');
  });
});
