import { test, expect } from '@playwright/test';
import AppHelper from '../../helpers/app-helper.js';
import FirefoxHelper from '../../helpers/firefox-helper.js';

test.describe('Capture via UnifiedHeaderEditor', () => {
  let appHelper;
  let firefoxHelper;

  test.beforeEach(async ({ page }) => {
    appHelper = new AppHelper(page);
    firefoxHelper = new FirefoxHelper(page);

    await page.goto('/sample', { waitUntil: 'domcontentloaded' });
    await appHelper.waitForAppReady();
  });

  test('should open capture template and show unified editor with title editor', async ({
    page,
  }) => {
    // Click the main capture button (+ icon at bottom-right)
    const captureMainBtn = page.locator('[data-testid="capture-main-button"]');
    await captureMainBtn.click();

    // Click the Groceries template button
    const groceriesBtn = page.locator('[data-testid="capture-template-groceries"]');
    await expect(groceriesBtn).toBeVisible({ timeout: 5000 });
    await groceriesBtn.click();

    // The unified header editor should appear (not the old CaptureModal textarea)
    await expect(page.locator('[data-testid="unified-header-editor"]')).toBeVisible({
      timeout: 5000,
    });

    // The capture header bar should be visible with the template description
    await expect(page.locator('[data-testid="capture-header-bar"]')).toBeVisible();
    await expect(page.locator('[data-testid="capture-template-description"]')).toHaveText(
      'Groceries'
    );

    // The title editor should be shown (since Groceries template is '* TODO %?' with cursor in title)
    const titleInput = page.locator('[data-testid="titleLineInput"]');
    await expect(titleInput).toBeVisible();

    // The Capture button should be visible
    await expect(page.locator('[data-testid="capture-confirm-button"]')).toBeVisible();
  });

  test('should persist title when switching to tags editor and back', async ({ page }) => {
    // Open capture via Groceries template
    await page.locator('[data-testid="capture-main-button"]').click();
    const groceriesBtn = page.locator('[data-testid="capture-template-groceries"]');
    await expect(groceriesBtn).toBeVisible({ timeout: 5000 });
    await groceriesBtn.click();

    // Wait for unified editor
    await expect(page.locator('[data-testid="unified-header-editor"]')).toBeVisible({
      timeout: 5000,
    });

    // Type a title in the title editor
    const titleInput = page.locator('[data-testid="titleLineInput"]');
    await expect(titleInput).toBeVisible();
    await titleInput.fill('Buy milk and eggs');

    // Switch to tags editor via the drawer action bar
    await firefoxHelper.clickClickCatcherButton('drawer-action-tags');

    // Wait for tags editor to appear
    await expect(page.locator('[data-testid="tags-editor-modal-title"]')).toBeVisible({
      timeout: 5000,
    });

    // The capture header bar should still be visible (we're still in capture mode)
    await expect(page.locator('[data-testid="capture-header-bar"]')).toBeVisible();

    // Switch back to title editor
    await firefoxHelper.clickClickCatcherButton('drawer-action-edit-title');

    // Wait for title input to reappear
    await expect(page.locator('[data-testid="titleLineInput"]')).toBeVisible({ timeout: 5000 });

    // The title should still have the value we typed
    await expect(page.locator('[data-testid="titleLineInput"]')).toHaveValue('Buy milk and eggs');
  });

  test('should capture a new header and close the drawer', async ({ page }) => {
    // Open capture via Groceries template
    await page.locator('[data-testid="capture-main-button"]').click();
    const groceriesBtn = page.locator('[data-testid="capture-template-groceries"]');
    await expect(groceriesBtn).toBeVisible({ timeout: 5000 });
    await groceriesBtn.click();

    // Wait for unified editor
    await expect(page.locator('[data-testid="unified-header-editor"]')).toBeVisible({
      timeout: 5000,
    });

    // Type a title
    const titleInput = page.locator('[data-testid="titleLineInput"]');
    await expect(titleInput).toBeVisible();
    await titleInput.fill('Buy bananas');

    // Click the Capture button
    await page.locator('[data-testid="capture-confirm-button"]').click();

    // The drawer should close (capture completed without errors)
    await expect(page.locator('[data-testid="drawer-outer-container"]')).not.toBeVisible({
      timeout: 5000,
    });

    // The unified editor should no longer be visible
    await expect(page.locator('[data-testid="unified-header-editor"]')).not.toBeVisible({
      timeout: 3000,
    });

    // The app should not have crashed
    await expect(page.locator('text=Uh oh')).not.toBeVisible();

    // Verify we can still interact with the page (no frozen state)
    const headerCount = await page.locator('.header').count();
    expect(headerCount).toBeGreaterThan(0);
  });

  test('should preserve title through description editor round-trip', async ({ page }) => {
    // Open capture via Groceries template
    await page.locator('[data-testid="capture-main-button"]').click();
    const groceriesBtn = page.locator('[data-testid="capture-template-groceries"]');
    await expect(groceriesBtn).toBeVisible({ timeout: 5000 });
    await groceriesBtn.click();

    await expect(page.locator('[data-testid="unified-header-editor"]')).toBeVisible({
      timeout: 5000,
    });

    // Type a title
    const titleInput = page.locator('[data-testid="titleLineInput"]');
    await expect(titleInput).toBeVisible();
    await titleInput.fill('Important grocery item');

    // Switch to description editor
    await firefoxHelper.clickClickCatcherButton('edit-header-title');

    // Wait for description editor to appear (textarea should change)
    // Description editor has a different title than the title editor
    await page.waitForTimeout(500); // Give time for the switch

    // Switch back to title editor
    await firefoxHelper.clickClickCatcherButton('drawer-action-edit-title');
    await expect(page.locator('[data-testid="titleLineInput"]')).toBeVisible({ timeout: 5000 });

    // Title should be preserved
    await expect(page.locator('[data-testid="titleLineInput"]')).toHaveValue(
      'Important grocery item'
    );

    // Now capture and verify it completes without errors
    await page.locator('[data-testid="capture-confirm-button"]').click();

    await expect(page.locator('[data-testid="drawer-outer-container"]')).not.toBeVisible({
      timeout: 5000,
    });

    // The app should not have crashed
    await expect(page.locator('text=Uh oh')).not.toBeVisible();
  });

  test('should capture title text into the new header', async ({ page }) => {
    // Open capture via Groceries template
    await page.locator('[data-testid="capture-main-button"]').click();
    const groceriesBtn = page.locator('[data-testid="capture-template-groceries"]');
    await expect(groceriesBtn).toBeVisible({ timeout: 5000 });
    await groceriesBtn.click();

    // Wait for unified editor
    await expect(page.locator('[data-testid="unified-header-editor"]')).toBeVisible({
      timeout: 5000,
    });

    // Type a title
    const titleInput = page.locator('[data-testid="titleLineInput"]');
    await expect(titleInput).toBeVisible();
    await titleInput.fill('UniqueTestCapture123');

    // Click the Capture button
    await page.locator('[data-testid="capture-confirm-button"]').click();

    // The drawer should close
    await expect(page.locator('[data-testid="drawer-outer-container"]')).not.toBeVisible({
      timeout: 5000,
    });

    // Verify the header was inserted with the correct title.
    // Since captured headers are under collapsed parents and not in the DOM,
    // we check by accessing the React component's internal state via fiber tree.
    const titleFound = await page.evaluate(() => {
      // Walk the DOM to find the org-file-container's React fiber
      const container = document.querySelector('.org-file-container');
      if (!container) return false;
      const fiberKey = Object.keys(container).find((k) => k.startsWith('__reactInternalInstance'));
      if (!fiberKey) return false;

      // Walk up the fiber tree to find the OrgFile component with Redux state
      let fiber = container[fiberKey];
      let headers = null;
      for (let i = 0; i < 50 && fiber; i++) {
        if (
          fiber.memoizedProps &&
          fiber.memoizedProps.headers &&
          fiber.memoizedProps.headers.toJS
        ) {
          headers = fiber.memoizedProps.headers.toJS();
          break;
        }
        fiber = fiber.return;
      }
      if (!headers) return false;

      // Check if any header has our title
      return headers.some(
        (h) =>
          h.titleLine &&
          h.titleLine.rawTitle &&
          h.titleLine.rawTitle.includes('UniqueTestCapture123')
      );
    });
    expect(titleFound).toBe(true);
  });

  test('should capture title and have it immediately visible in Redux state', async ({ page }) => {
    // Open capture via Groceries template
    await page.locator('[data-testid="capture-main-button"]').click();
    const groceriesBtn = page.locator('[data-testid="capture-template-groceries"]');
    await expect(groceriesBtn).toBeVisible({ timeout: 5000 });
    await groceriesBtn.click();

    await expect(page.locator('[data-testid="unified-header-editor"]')).toBeVisible({
      timeout: 5000,
    });

    // Type a title
    const titleInput = page.locator('[data-testid="titleLineInput"]');
    await expect(titleInput).toBeVisible();
    await titleInput.fill('ImmediateTitleCheck');

    // Capture
    await page.locator('[data-testid="capture-confirm-button"]').click();
    await expect(page.locator('[data-testid="drawer-outer-container"]')).not.toBeVisible({
      timeout: 5000,
    });

    // Verify the header's parsed title (attributed string) is set, not just rawTitle
    const titleParsed = await page.evaluate(() => {
      const container = document.querySelector('.org-file-container');
      if (!container) return null;
      const fiberKey = Object.keys(container).find((k) => k.startsWith('__reactInternalInstance'));
      if (!fiberKey) return null;
      let fiber = container[fiberKey];
      let headers = null;
      for (let i = 0; i < 50 && fiber; i++) {
        if (
          fiber.memoizedProps &&
          fiber.memoizedProps.headers &&
          fiber.memoizedProps.headers.toJS
        ) {
          headers = fiber.memoizedProps.headers.toJS();
          break;
        }
        fiber = fiber.return;
      }
      if (!headers) return null;
      const h = headers.find(
        (h) =>
          h.titleLine &&
          h.titleLine.rawTitle &&
          h.titleLine.rawTitle.includes('ImmediateTitleCheck')
      );
      if (!h) return null;
      return {
        rawTitle: h.titleLine.rawTitle,
        titleLength: h.titleLine.title ? h.titleLine.title.length : 0,
        titleFirstType:
          h.titleLine.title && h.titleLine.title[0] ? h.titleLine.title[0].type : null,
      };
    });
    expect(titleParsed).not.toBeNull();
    expect(titleParsed.rawTitle).toContain('ImmediateTitleCheck');
    // title (attributed string) must be populated, not empty
    expect(titleParsed.titleLength).toBeGreaterThan(0);
    expect(titleParsed.titleFirstType).toBe('text');
  });

  test('should capture description and have it immediately in Redux state', async ({ page }) => {
    // Open capture via Groceries template
    await page.locator('[data-testid="capture-main-button"]').click();
    const groceriesBtn = page.locator('[data-testid="capture-template-groceries"]');
    await expect(groceriesBtn).toBeVisible({ timeout: 5000 });
    await groceriesBtn.click();

    await expect(page.locator('[data-testid="unified-header-editor"]')).toBeVisible({
      timeout: 5000,
    });

    // Switch to description editor
    await firefoxHelper.clickClickCatcherButton('edit-header-title');
    await page.waitForTimeout(500);

    // Type a description
    const descTextarea = page.locator('.header-content__edit-container textarea');
    await expect(descTextarea).toBeVisible({ timeout: 5000 });
    await descTextarea.fill('This is my capture description');

    // Capture
    await page.locator('[data-testid="capture-confirm-button"]').click();
    await expect(page.locator('[data-testid="drawer-outer-container"]')).not.toBeVisible({
      timeout: 5000,
    });

    // Verify both rawDescription and parsed description are set
    const descResult = await page.evaluate(() => {
      const container = document.querySelector('.org-file-container');
      if (!container) return null;
      const fiberKey = Object.keys(container).find((k) => k.startsWith('__reactInternalInstance'));
      if (!fiberKey) return null;
      let fiber = container[fiberKey];
      let headers = null;
      for (let i = 0; i < 50 && fiber; i++) {
        if (
          fiber.memoizedProps &&
          fiber.memoizedProps.headers &&
          fiber.memoizedProps.headers.toJS
        ) {
          headers = fiber.memoizedProps.headers.toJS();
          break;
        }
        fiber = fiber.return;
      }
      if (!headers) return null;
      // Find the captured header (most recent TODO with our description)
      const h = headers.find(
        (h) => h.rawDescription && h.rawDescription.includes('This is my capture description')
      );
      if (!h) return null;
      return {
        rawDescription: h.rawDescription,
        descriptionLength: h.description ? h.description.length : 0,
        descriptionFirstType: h.description && h.description[0] ? h.description[0].type : null,
      };
    });
    expect(descResult).not.toBeNull();
    expect(descResult.rawDescription).toContain('This is my capture description');
    // parsed description must be populated (not empty) for immediate rendering
    expect(descResult.descriptionLength).toBeGreaterThan(0);
  });

  test('should capture tags and have them immediately in Redux state', async ({ page }) => {
    // Open capture via Groceries template
    await page.locator('[data-testid="capture-main-button"]').click();
    const groceriesBtn = page.locator('[data-testid="capture-template-groceries"]');
    await expect(groceriesBtn).toBeVisible({ timeout: 5000 });
    await groceriesBtn.click();

    await expect(page.locator('[data-testid="unified-header-editor"]')).toBeVisible({
      timeout: 5000,
    });

    // Type a title first (to identify the header later)
    const titleInput = page.locator('[data-testid="titleLineInput"]');
    await expect(titleInput).toBeVisible();
    await titleInput.fill('TagTestCapture');

    // Switch to tags editor
    await firefoxHelper.clickClickCatcherButton('drawer-action-tags');
    await expect(page.locator('[data-testid="tags-editor-modal-title"]')).toBeVisible({
      timeout: 5000,
    });

    // Add a new tag
    await page.locator('[data-testid="tags-editor-add-button"]').click();
    const tagInput = page.locator('.tag-container__textfield').last();
    await expect(tagInput).toBeVisible();
    await tagInput.fill('urgent');

    // Capture
    await page.locator('[data-testid="capture-confirm-button"]').click();
    await expect(page.locator('[data-testid="drawer-outer-container"]')).not.toBeVisible({
      timeout: 5000,
    });

    // Verify the captured header has tags in Redux state
    const tagResult = await page.evaluate(() => {
      const container = document.querySelector('.org-file-container');
      if (!container) return null;
      const fiberKey = Object.keys(container).find((k) => k.startsWith('__reactInternalInstance'));
      if (!fiberKey) return null;
      let fiber = container[fiberKey];
      let headers = null;
      for (let i = 0; i < 50 && fiber; i++) {
        if (
          fiber.memoizedProps &&
          fiber.memoizedProps.headers &&
          fiber.memoizedProps.headers.toJS
        ) {
          headers = fiber.memoizedProps.headers.toJS();
          break;
        }
        fiber = fiber.return;
      }
      if (!headers) return null;
      const h = headers.find(
        (h) =>
          h.titleLine && h.titleLine.rawTitle && h.titleLine.rawTitle.includes('TagTestCapture')
      );
      if (!h) return null;
      return {
        tags: h.titleLine.tags,
      };
    });
    expect(tagResult).not.toBeNull();
    expect(tagResult.tags).toContain('urgent');
  });

  test('should capture with all attributes and verify immediate Redux state', async ({ page }) => {
    // Open capture via Groceries template
    await page.locator('[data-testid="capture-main-button"]').click();
    const groceriesBtn = page.locator('[data-testid="capture-template-groceries"]');
    await expect(groceriesBtn).toBeVisible({ timeout: 5000 });
    await groceriesBtn.click();

    await expect(page.locator('[data-testid="unified-header-editor"]')).toBeVisible({
      timeout: 5000,
    });

    // 1. Set title
    const titleInput = page.locator('[data-testid="titleLineInput"]');
    await expect(titleInput).toBeVisible();
    await titleInput.fill('FullCaptureTest');

    // 2. Switch to description editor and set description
    await firefoxHelper.clickClickCatcherButton('edit-header-title');
    await page.waitForTimeout(500);
    const descTextarea = page.locator('.header-content__edit-container textarea');
    await expect(descTextarea).toBeVisible({ timeout: 5000 });
    await descTextarea.fill('A detailed description for the test');

    // 3. Switch to tags editor and add a tag
    await firefoxHelper.clickClickCatcherButton('drawer-action-tags');
    await expect(page.locator('[data-testid="tags-editor-modal-title"]')).toBeVisible({
      timeout: 5000,
    });
    await page.locator('[data-testid="tags-editor-add-button"]').click();
    const tagInput = page.locator('.tag-container__textfield').last();
    await expect(tagInput).toBeVisible();
    await tagInput.fill('review');

    // 4. Capture
    await page.locator('[data-testid="capture-confirm-button"]').click();
    await expect(page.locator('[data-testid="drawer-outer-container"]')).not.toBeVisible({
      timeout: 5000,
    });

    // 5. Verify ALL attributes are immediately present in Redux state
    const result = await page.evaluate(() => {
      const container = document.querySelector('.org-file-container');
      if (!container) return null;
      const fiberKey = Object.keys(container).find((k) => k.startsWith('__reactInternalInstance'));
      if (!fiberKey) return null;
      let fiber = container[fiberKey];
      let headers = null;
      for (let i = 0; i < 50 && fiber; i++) {
        if (
          fiber.memoizedProps &&
          fiber.memoizedProps.headers &&
          fiber.memoizedProps.headers.toJS
        ) {
          headers = fiber.memoizedProps.headers.toJS();
          break;
        }
        fiber = fiber.return;
      }
      if (!headers) return null;
      const h = headers.find(
        (h) =>
          h.titleLine && h.titleLine.rawTitle && h.titleLine.rawTitle.includes('FullCaptureTest')
      );
      if (!h) return null;
      return {
        rawTitle: h.titleLine.rawTitle,
        titleParsedLength: h.titleLine.title ? h.titleLine.title.length : 0,
        todoKeyword: h.titleLine.todoKeyword,
        tags: h.titleLine.tags,
        rawDescription: h.rawDescription,
        descriptionParsedLength: h.description ? h.description.length : 0,
      };
    });
    expect(result).not.toBeNull();
    // Title
    expect(result.rawTitle).toContain('FullCaptureTest');
    expect(result.titleParsedLength).toBeGreaterThan(0);
    // TODO keyword (from Groceries template: '* TODO %?')
    expect(result.todoKeyword).toBe('TODO');
    // Tags
    expect(result.tags).toContain('review');
    // Description - parsed description must exist for immediate rendering
    expect(result.rawDescription).toContain('A detailed description for the test');
    expect(result.descriptionParsedLength).toBeGreaterThan(0);
  });

  test('should toggle prepend checkbox', async ({ page }) => {
    // Open capture via Groceries template (shouldPrepend defaults to false)
    await page.locator('[data-testid="capture-main-button"]').click();
    const groceriesBtn = page.locator('[data-testid="capture-template-groceries"]');
    await expect(groceriesBtn).toBeVisible({ timeout: 5000 });
    await groceriesBtn.click();

    await expect(page.locator('[data-testid="unified-header-editor"]')).toBeVisible({
      timeout: 5000,
    });

    // Prepend checkbox should be unchecked by default (Groceries template has shouldPrepend: false)
    const prependCheckbox = page.locator('[data-testid="capture-prepend-checkbox"]');
    await expect(prependCheckbox).not.toBeChecked();

    // Toggle it on
    await prependCheckbox.click();
    await expect(prependCheckbox).toBeChecked();

    // Toggle it off again
    await prependCheckbox.click();
    await expect(prependCheckbox).not.toBeChecked();
  });
});
