import { test, expect } from '../../fixtures.js';

// sample.org documents two capture templates: 'Groceries' inserts a TODO under
// Capture > Groceries, 'Deeply nested header' prepends under
// Capture > Deeply > Nested > Headers > Work > Too! (src/lib/sample_capture_templates.js).
test.describe('Capture via UnifiedHeaderEditor', () => {
  const openTemplate = async (page, templateTestId = 'capture-template-groceries') => {
    await page.getByTestId('capture-main-button').click();
    await page.getByTestId(templateTestId).click();
    await expect(page.getByTestId('unified-header-editor')).toBeVisible();
  };

  test('should open capture template and show unified editor with title editor', async ({
    page,
  }) => {
    await openTemplate(page);

    await expect(page.getByTestId('capture-header-bar')).toBeVisible();
    await expect(page.getByTestId('capture-template-description')).toHaveText('Groceries');
    // The Groceries template is '* TODO %?' with the cursor in the title
    await expect(page.getByTestId('titleLineInput')).toBeVisible();
    await expect(page.getByTestId('capture-confirm-button')).toBeVisible();
  });

  test('should persist title when switching to tags editor and back', async ({ page, sample }) => {
    await openTemplate(page);
    await page.getByTestId('titleLineInput').fill('Buy milk and eggs');

    await sample.action('drawer-action-tags');
    await expect(page.getByTestId('tags-editor-modal-title')).toBeVisible();
    // Still in capture mode
    await expect(page.getByTestId('capture-header-bar')).toBeVisible();

    await sample.action('drawer-action-edit-title');
    await expect(page.getByTestId('titleLineInput')).toHaveValue('Buy milk and eggs');
  });

  test('should preserve title through description editor round-trip', async ({ page, sample }) => {
    await openTemplate(page);
    await page.getByTestId('titleLineInput').fill('Important grocery item');

    await sample.action('edit-header-title');
    await expect(page.getByTestId('description-textarea')).toBeVisible();

    await sample.action('drawer-action-edit-title');
    await expect(page.getByTestId('titleLineInput')).toHaveValue('Important grocery item');
  });

  test('should capture title, tags and description under Capture > Groceries', async ({
    page,
    sample,
  }) => {
    await openTemplate(page);

    await page.getByTestId('titleLineInput').fill('FullCaptureTest');

    await sample.action('edit-header-title');
    await page.getByTestId('description-textarea').fill('A detailed description for the test');

    await sample.action('drawer-action-tags');
    await page.getByTestId('tags-editor-add-button').click();
    await page.locator('.tag-container__textfield').last().fill('review');

    await page.getByTestId('capture-confirm-button').click();
    await expect(sample.drawer).toHaveCount(0);
    await expect(page.getByText('Uh oh')).toHaveCount(0);

    await sample.expand('Capture', 'Groceries');
    const titles = await sample.titles();
    expect(titles[titles.indexOf('Groceries') + 1]).toBe('FullCaptureTest');

    const captured = sample.header('FullCaptureTest');
    await expect(captured.locator('.todo-keyword')).toHaveText('TODO');
    await expect(captured.locator('.header-tag')).toHaveText(['review']);

    await sample.select('FullCaptureTest');
    await expect(captured.locator('..')).toContainText('A detailed description for the test');
  });

  test('should capture header when pressing Enter in title editor', async ({ page, sample }) => {
    await openTemplate(page);

    await page.getByTestId('titleLineInput').fill('EnterCaptureTest');
    await page.getByTestId('titleLineInput').press('Enter');
    await expect(sample.drawer).toHaveCount(0);

    await sample.expand('Capture', 'Groceries');
    await expect(sample.header('EnterCaptureTest')).toBeVisible();
  });

  test('should prepend into a deeply nested header', async ({ page, sample }) => {
    await openTemplate(page, 'capture-template-deeply-nested-header');

    // The template is '* You can insert timestamps too! %T %?'; append to it
    const titleInput = page.getByTestId('titleLineInput');
    await expect(titleInput).toHaveValue(/^You can insert timestamps too! <\d{4}-\d{2}-\d{2}/);
    await titleInput.press('End');
    await titleInput.pressSequentially('DeepCapture');
    await page.getByTestId('capture-confirm-button').click();
    await expect(sample.drawer).toHaveCount(0);

    await sample.expand('Capture', 'Deeply', 'Nested', /^Headers/, 'Work', 'Too!');
    const titles = await sample.titles();
    expect(titles[titles.indexOf('Too!') + 1]).toMatch(
      /^You can insert timestamps too! .*DeepCapture$/
    );
  });

  test('should toggle prepend checkbox', async ({ page }) => {
    await openTemplate(page);

    // The Groceries template has shouldPrepend: false
    const prependCheckbox = page.getByTestId('capture-prepend-checkbox');
    await expect(prependCheckbox).not.toBeChecked();

    await prependCheckbox.click();
    await expect(prependCheckbox).toBeChecked();

    await prependCheckbox.click();
    await expect(prependCheckbox).not.toBeChecked();
  });
});
