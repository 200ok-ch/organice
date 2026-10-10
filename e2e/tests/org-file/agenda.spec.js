import { test, expect } from '../../fixtures.js';

// sample.org, "Agenda" and "Habit tracking". The sample dates lie in the
// past, so the overdue items show up on today's entry.
test.describe('Agenda', () => {
  test.beforeEach(async ({ page, sample }) => {
    await page.getByTitle('Show agenda').click();
    await sample.settle();
    await expect(page.locator('.agenda__title')).toBeVisible();
  });

  const today = (page) =>
    page.locator('.agenda-day__container', { has: page.locator('.agenda-day__today-indicator') });
  const entry = (page, title) =>
    today(page).locator('.agenda-day__header-container', { hasText: title });

  test("lists overdue deadlines and scheduled items on today's entry", async ({ page }) => {
    await expect(entry(page, 'Check out the organice agenda view')).toContainText('DEADLINE');
    await expect(
      entry(page, 'Install organice to the homescreen on my mobile phone')
    ).toContainText('SCHEDULED');
    // An entry with just an active timestamp shows only on exactly that day
    await expect(today(page)).not.toContainText('This entry shows only exactly on');
  });

  test('tapping the date toggles relative and absolute format', async ({ page }) => {
    const date = entry(page, 'Check out the organice agenda view').locator(
      '.agenda-day__header-planning-date'
    );
    await expect(date).toHaveText('09/10');

    await date.click();
    await expect(date).toHaveText(/ago/);

    await date.click();
    await expect(date).toHaveText('09/10');
  });

  test('tapping an entry jumps to its header', async ({ page, sample }) => {
    await entry(page, 'Check out the organice agenda view').locator('.title-line').click();

    await expect(page.locator('.agenda__title')).toHaveCount(0);
    const header = sample.header('Check out the organice agenda view');
    await expect(header).toBeVisible();
    await expect(header.getByTestId('header-action-drawer')).toBeVisible();
  });

  test('habits show a consistency graph', async ({ page }) => {
    const graph = entry(page, 'Exercise').locator('.habit-consistency-graph');
    await expect(graph).toBeVisible();

    // 21 preceding days, today and 7 following days by default
    const days = graph.locator('.habit-consistency-graph__day');
    await expect(days).toHaveCount(29);
    await expect(graph.locator('.habit-consistency-graph__day--today')).toHaveCount(1);
    // Scheduled since January and never done: today is overdue
    await expect(graph.locator('.habit-consistency-graph__day--today')).toHaveClass(
      /habit-consistency-graph__day--overdue/
    );
  });
});
