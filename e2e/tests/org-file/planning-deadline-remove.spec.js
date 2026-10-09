import { test, expect } from '@playwright/test';
import AppHelper from '../../helpers/app-helper.js';
import FirefoxHelper from '../../helpers/firefox-helper.js';

test.describe('Planning Deadline Removal', () => {
  let appHelper;
  let firefoxHelper;

  test.beforeEach(async ({ page }) => {
    appHelper = new AppHelper(page);
    firefoxHelper = new FirefoxHelper(page);

    await page.goto('/sample', { waitUntil: 'domcontentloaded' });
    await appHelper.waitForAppReady();
  });

  test('clearing the deadline date removes DEADLINE planning item', async ({ page }) => {
    const tablesHeader = page.locator('.header').filter({ hasText: 'Tables' }).first();
    await tablesHeader.scrollIntoViewIfNeeded();
    await tablesHeader.click();

    await expect(page.locator('[data-testid="header-action-drawer"]')).toBeVisible();
    await firefoxHelper.clickClickCatcherButton('drawer-action-deadline');
    await expect(page.locator('.timestamp-editor__title:has-text("Edit deadline")')).toBeVisible();

    await page.locator('.timestamp-editor__icon--add').first().click();
    const dateInput = page.locator('[data-testid="timestamp-selector"]');
    const currentDate = await dateInput.inputValue();
    const [year, month] = currentDate.split('-');
    const deadlineDate = `${year}-${month}-15`;
    await dateInput.fill(deadlineDate);

    await firefoxHelper.clickClickCatcherButton('drawer-action-edit-title');
    await page.locator('[data-testid="drawer-outer-container"]').first().click();
    await expect(page.locator('[data-testid="drawer-outer-container"]')).not.toBeVisible({
      timeout: 5000,
    });

    const headerContainer = tablesHeader.locator('..');
    await expect(headerContainer).toContainText('DEADLINE:');

    await tablesHeader.click();
    await expect(page.locator('[data-testid="header-action-drawer"]')).toBeVisible();
    await firefoxHelper.clickClickCatcherButton('drawer-action-deadline');
    await expect(page.locator('.timestamp-editor__title:has-text("Edit deadline")')).toBeVisible();

    await dateInput.fill('');

    await firefoxHelper.clickClickCatcherButton('drawer-action-edit-title');
    await page.locator('[data-testid="drawer-outer-container"]').first().click();
    await expect(page.locator('[data-testid="drawer-outer-container"]')).not.toBeVisible({
      timeout: 5000,
    });

    await expect(headerContainer).not.toContainText('DEADLINE:');
  });
});
