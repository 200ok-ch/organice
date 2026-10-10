import { test, expect } from '../../fixtures.js';

test.describe('Task List Date Toggle', () => {
  test('clicking a task date toggles relative and back to absolute format', async ({
    page,
    sample,
  }) => {
    await sample.openSearch('Task List');

    const planningDate = page.locator('.task-list__header-planning-date').first();
    const absoluteDate = /^\d{2}\/\d{2}$/;
    await expect(planningDate).toHaveText(absoluteDate);

    await planningDate.click();
    await expect(planningDate).not.toHaveText(absoluteDate);
    await expect(planningDate).toHaveText(/[a-zA-Z]/);

    await planningDate.click();
    await expect(planningDate).toHaveText(absoluteDate);
  });
});
