import { test, expect } from '@playwright/test';
import AppHelper from '../../helpers/app-helper.js';

test.describe('Task List Bookmarks', () => {
  let appHelper;

  test.beforeEach(async ({ page }) => {
    appHelper = new AppHelper(page);

    await page.goto('/sample', { waitUntil: 'domcontentloaded' });
    await appHelper.waitForAppReady();
  });

  test('bookmarks are scoped to task-list context', async ({ page }) => {
    const filter = 'TODO :fun';

    await page.getByTitle('Show Search / Task List').click();
    await page.locator('.tab-buttons__btn', { hasText: 'Task List' }).first().click();

    const filterInput = page.getByPlaceholder(
      'e.g. -DONE doc|man :simple|easy :assignee:nobody|none'
    );
    await expect(filterInput).toBeVisible();
    await filterInput.fill(filter);

    const bookmarkButton = page.locator('.bookmark__icon').first();
    await expect(bookmarkButton).toHaveClass(/fa-star/);
    await bookmarkButton.click();
    await expect(bookmarkButton).toHaveClass(/fa-trash/);

    await filterInput.fill('');
    await expect(page.locator(`#task-list__datalist-filter option[value="${filter}"]`)).toHaveCount(
      1
    );

    await page.locator('.tab-buttons__btn', { hasText: 'Search' }).first().click();
    await filterInput.fill('');

    await expect(page.locator(`#task-list__datalist-filter option[value="${filter}"]`)).toHaveCount(
      0
    );
  });
});
