import { test, expect } from '../../fixtures.js';

// sample.org, "Tables" and "Table actions": selecting a table opens the
// table editor; its action buttons need a selected cell.
test.describe('Tables', () => {
  test.beforeEach(async ({ page, sample }) => {
    const header = await sample.select('Tables');
    await header.locator('.table-part').click();
    await sample.settle();
    await expect(page.locator('.drawer-modal__title', { hasText: 'Edit table' })).toBeVisible();
  });

  const editorTable = (sample) => sample.drawer.locator('.table-part');
  const cell = (sample, text) =>
    editorTable(sample).locator('.table-part__cell', { hasText: new RegExp(`^\\s*${text}\\s*$`) });
  const firstColumn = (sample) =>
    editorTable(sample)
      .locator('tr')
      .evaluateAll((rows) => rows.map((row) => row.querySelector('td')?.textContent.trim()));

  test('edits a cell and shows the change in the header', async ({ page, sample }) => {
    await cell(sample, 'Eloise').click();
    await page.getByTestId('edit-cell-button').click();
    await page.getByTestId('edit-cell-container').fill('Ellie');
    // Selecting another cell leaves the cell editor and saves
    await cell(sample, 'Starla').click();
    await expect(cell(sample, 'Ellie')).toBeVisible();

    await sample.closeDrawer({ commit: false });
    await expect(sample.header('Tables').locator('.table-part')).toContainText('Ellie');
  });

  test('adds and removes a row', async ({ page, sample }) => {
    const rows = editorTable(sample).locator('tr');
    const initialRows = await rows.count();

    await cell(sample, 'Eloise').click();
    await page.getByTestId('add-row-button').click();
    await expect(rows).toHaveCount(initialRows + 1);

    await page.getByTestId('delete-row-button').click();
    await expect(rows).toHaveCount(initialRows);
  });

  test('adds and removes a column', async ({ page, sample }) => {
    const headerCells = editorTable(sample).locator('tr').first().locator('td');
    const initialColumns = await headerCells.count();

    await cell(sample, 'Eloise').click();
    await page.getByTestId('add-column-button').click();
    await expect(headerCells).toHaveCount(initialColumns + 1);

    await page.getByTestId('delete-column-button').click();
    await expect(headerCells).toHaveCount(initialColumns);
  });

  test('moves a row down and a column right', async ({ page, sample }) => {
    expect((await firstColumn(sample)).slice(0, 3)).toEqual(['Dog name', 'Eloise', 'Starla']);

    await cell(sample, 'Eloise').click();
    await page.getByTestId('down-button').click();
    await expect
      .poll(async () => (await firstColumn(sample)).slice(0, 3))
      .toEqual(['Dog name', 'Starla', 'Eloise']);

    await page.getByTestId('right-button').click();
    await expect.poll(async () => (await firstColumn(sample))[0]).toBe('Age');
  });
});
