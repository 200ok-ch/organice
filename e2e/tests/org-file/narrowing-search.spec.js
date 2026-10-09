import { test, expect } from '@playwright/test';
import AppHelper from '../../helpers/app-helper.js';
import FirefoxHelper from '../../helpers/firefox-helper.js';

test.describe('Narrowing with Search', () => {
  let appHelper;
  let firefoxHelper;

  test.beforeEach(async ({ page }) => {
    appHelper = new AppHelper(page);
    firefoxHelper = new FirefoxHelper(page);

    await page.goto('/sample', { waitUntil: 'domcontentloaded' });
    await appHelper.waitForAppReady();
  });

  test('search is scoped to a narrowed header subtree', async ({ page }) => {
    const actionsHeader = page.locator('.header').filter({ hasText: 'Actions' }).first();
    await actionsHeader.scrollIntoViewIfNeeded();
    await actionsHeader.click();

    await expect(page.locator('[data-testid="header-action-drawer"]')).toBeVisible();
    await firefoxHelper.clickClickCatcherButton('header-action-narrow');

    await page.getByTitle('Show Search / Task List').click();
    const drawer = page.locator('[data-testid="drawer"]');

    await expect(drawer).toContainText('Editing headers');
    await expect(drawer).not.toContainText('Tables');
  });
});
