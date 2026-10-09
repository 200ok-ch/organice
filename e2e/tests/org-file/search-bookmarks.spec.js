import { test, expect } from '@playwright/test';
import AppHelper from '../../helpers/app-helper.js';

test.describe('Search Bookmarks', () => {
  let appHelper;

  test.beforeEach(async ({ page }) => {
    appHelper = new AppHelper(page);

    await page.goto('/sample', { waitUntil: 'domcontentloaded' });
    await appHelper.waitForAppReady();
  });

  test('bookmarks are scoped to search context', async ({ page }) => {
    const searchFilter = 'TODO :fun';

    await page.getByTitle('Show Search / Task List').click();

    const filterInput = page.getByPlaceholder(
      'e.g. -DONE doc|man :simple|easy :assignee:nobody|none'
    );
    await expect(filterInput).toBeVisible();

    await filterInput.fill(searchFilter);

    const bookmarkButton = page.locator('.bookmark__icon').first();
    await expect(bookmarkButton).toHaveClass(/fa-star/);
    await expect(bookmarkButton).toHaveClass(/bookmark__icon__enabled/);

    await bookmarkButton.click();
    await expect(bookmarkButton).toHaveClass(/fa-trash/);

    await filterInput.fill('');
    await expect(
      page.locator(`#task-list__datalist-filter option[value="${searchFilter}"]`)
    ).toHaveCount(1);

    await page.locator('.tab-buttons__btn', { hasText: 'Task List' }).first().click();
    await filterInput.fill('');

    await expect(
      page.locator(`#task-list__datalist-filter option[value="${searchFilter}"]`)
    ).toHaveCount(0);
  });
});
