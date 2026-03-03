import { test, expect } from '@playwright/test';
import AppHelper from '../../helpers/app-helper.js';

test.describe('Search Bookmark Deletion', () => {
  let appHelper;

  test.beforeEach(async ({ page }) => {
    appHelper = new AppHelper(page);

    await page.goto('/sample', { waitUntil: 'domcontentloaded' });
    await appHelper.waitForAppReady();
  });

  test('deleting a saved bookmark removes it from suggestions', async ({ page }) => {
    const filter = 'START|FINISHED states';

    await page.getByTitle('Show Search / Task List').click();

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

    await filterInput.fill(filter);
    await bookmarkButton.click();
    await expect(bookmarkButton).toHaveClass(/fa-star/);

    await filterInput.fill('');
    await expect(page.locator(`#task-list__datalist-filter option[value="${filter}"]`)).toHaveCount(
      0
    );
  });
});
