import { test, expect } from '../../fixtures.js';

// sample.org, "Search / Task List / Clock List".
test.describe('Search', () => {
  const filterInput = (page) =>
    page.getByPlaceholder('e.g. -DONE doc|man :simple|easy :assignee:nobody|none');
  const results = (page) => page.locator('.task-list__headers-container .title-line');
  const suggestions = (page) =>
    page
      .locator('#task-list__datalist-filter option')
      .evaluateAll((options) => options.map((option) => option.value));

  // Saves the filter as a bookmark with the star button.
  const bookmark = async (page, filter) => {
    const bookmarkButton = page.locator('.bookmark__icon').first();
    await filterInput(page).fill(filter);
    // The star is enabled once the filter has been parsed as valid
    await expect(bookmarkButton).toHaveClass(/bookmark__icon__enabled/);
    await expect(bookmarkButton).toHaveClass(/fa-star/);
    await bookmarkButton.click();
    await expect(bookmarkButton).toHaveClass(/fa-trash/);
  };

  test('filters headlines with the documented search syntax', async ({ page, sample }) => {
    await sample.openSearch('Search');

    await filterInput(page).fill('START|FINISHED "states are"');
    await expect(results(page)).toHaveText([/See that custom TODO states are colored correctly/]);

    await filterInput(page).fill('-DONE :fun');
    await expect(results(page)).toHaveText([/Example with properties/]);
  });

  test('tapping a result jumps to its header', async ({ page, sample }) => {
    await sample.openSearch('Search');
    await filterInput(page).fill('custom TODO states are colored');
    await results(page).first().click();

    await expect(page.getByTestId('drawer')).toHaveCount(0);
    const header = sample.header('See that custom TODO states are colored correctly');
    await expect(header).toBeVisible();
    await expect(header.getByTestId('header-action-drawer')).toBeVisible();
  });

  test('opens on the tab that was used last', async ({ page, sample }) => {
    await sample.openSearch('Task List');
    await sample.closeDrawer({ commit: false });

    await page.getByTitle('Show Search / Task List').click();
    await sample.settle();
    await expect(page.locator('.tab-buttons__btn--selected')).toHaveText('Task List');
  });

  test('a running clock adds the Clock List tab', async ({ page, sample }) => {
    await page.getByTitle('Show Search / Task List').click();
    await sample.settle();
    await expect(page.locator('.tab-buttons__btn', { hasText: 'Clock List' })).toHaveCount(0);
    await sample.closeDrawer({ commit: false });

    await sample.select('Tables');
    await sample.action('org-clock-in');
    await sample.closeDrawer();

    const drawer = await sample.openSearch('Clock List');
    await expect(drawer.locator('.task-list__headers-container')).toContainText('Tables');
  });

  test.describe('bookmarks', () => {
    test('are scoped to the search context', async ({ page, sample }) => {
      await sample.openSearch('Search');
      await bookmark(page, 'TODO :fun');

      await filterInput(page).fill('');
      await expect.poll(() => suggestions(page)).toContain('TODO :fun');

      await page.locator('.tab-buttons__btn', { hasText: 'Task List' }).click();
      await filterInput(page).fill('');
      await expect.poll(() => suggestions(page)).not.toContain('TODO :fun');
    });

    test('are scoped to the task list context', async ({ page, sample }) => {
      await sample.openSearch('Task List');
      await bookmark(page, 'TODO :fun');

      await filterInput(page).fill('');
      await expect.poll(() => suggestions(page)).toContain('TODO :fun');

      await page.locator('.tab-buttons__btn', { hasText: 'Search' }).click();
      await filterInput(page).fill('');
      await expect.poll(() => suggestions(page)).not.toContain('TODO :fun');
    });

    test('can be deleted', async ({ page, sample }) => {
      await sample.openSearch('Search');
      await bookmark(page, 'START|FINISHED states');

      // The trash button deletes the bookmark of the current filter
      const bookmarkButton = page.locator('.bookmark__icon').first();
      await bookmarkButton.click();
      await expect(bookmarkButton).toHaveClass(/fa-star/);

      await filterInput(page).fill('');
      await expect.poll(() => suggestions(page)).not.toContain('START|FINISHED states');
    });

    test('keep the ten most recent, newest first', async ({ page, sample }) => {
      await sample.openSearch('Search');
      const filters = Array.from({ length: 11 }, (_, i) => `bookmark${i}`);
      for (const filter of filters) {
        await bookmark(page, filter);
      }

      await filterInput(page).fill('');
      await expect.poll(() => suggestions(page)).toEqual(filters.slice(1).reverse());
    });
  });
});
