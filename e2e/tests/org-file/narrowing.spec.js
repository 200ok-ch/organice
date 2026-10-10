import { test, expect } from '../../fixtures.js';

// sample.org, "Narrowing" and "Search / Task List / Clock List".
test.describe('Narrowing', () => {
  test('narrowing shows only the subtree and narrowing again widens', async ({ sample }) => {
    await sample.expand('Actions', 'Narrowing');
    await sample.select('Groceries');
    await sample.action('header-action-narrow');

    await expect.poll(() => sample.titles()).toEqual(['Groceries']);
    await expect(sample.header('Groceries')).toContainText('Dark chocolate');

    // The narrow icon turns into a widen icon
    await sample.actionByTitle('Widen');

    await expect(sample.header('Actions')).toBeVisible();
    await expect(sample.header('Tables')).toBeVisible();
  });

  test('search is scoped to a narrowed header subtree', async ({ sample }) => {
    await sample.select('Actions');
    await sample.action('header-action-narrow');

    const drawer = await sample.openSearch('Search');
    await expect(drawer).toContainText('Editing headers');
    await expect(drawer).not.toContainText('Tables');
  });

  test('task list is scoped to a narrowed header subtree', async ({ sample }) => {
    await sample.select('Actions');
    await sample.action('header-action-narrow');

    const drawer = await sample.openSearch('Task List');
    await expect(drawer).toContainText('Investigate custom TODO states');
    await expect(drawer).not.toContainText('Check out the organice agenda view');
  });
});
