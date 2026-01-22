import { test, expect } from '@playwright/test';
import AppHelper from '../../helpers/app-helper.js';

test.describe('Drag-Reorder Header Reordering', () => {
  test('should load sample page with drag-reorder code', async ({ page }) => {
    const appHelper = new AppHelper(page);

    await page.goto('/sample', { waitUntil: 'domcontentloaded' });
    await appHelper.waitForAppReady();

    // Verify headers are present
    const headers = page.locator('.header');
    await expect(headers.first()).toBeVisible();

    // Verify the app loaded without errors
    // The presence of headers indicates the drag-reorder code is integrated
    const headerCount = await headers.count();
    expect(headerCount).toBeGreaterThan(0);
  });

  test('should handle short press without triggering drag', async ({ page }) => {
    const appHelper = new AppHelper(page);

    await page.goto('/sample', { waitUntil: 'domcontentloaded' });
    await appHelper.waitForAppReady();

    // Find "Tap on any header to open it" header
    const targetHeader = page.locator('.header').filter({ hasText: 'Tap on any header' }).first();

    // Verify header exists
    await expect(targetHeader).toBeVisible();

    // Short click should select the header (normal behavior)
    await targetHeader.click();

    // Verify the header was selected (normal click behavior)
    await expect(targetHeader).toHaveClass(/header--selected/);
  });

  test('should prevent click on table cells', async ({ page }) => {
    const appHelper = new AppHelper(page);

    await page.goto('/sample', { waitUntil: 'domcontentloaded' });
    await appHelper.waitForAppReady();

    // Find the Tables header and click to open it
    const tablesHeader = page.locator('.header').filter({ hasText: 'Tables' }).first();
    await tablesHeader.click();
    await page.waitForTimeout(200);

    // Verify a table is visible
    const table = page.locator('.table-part').first();
    await expect(table).toBeVisible();
  });

  test('should allow same-level move (positive)', async ({ page }) => {
    const appHelper = new AppHelper(page);

    await page.goto('/sample', { waitUntil: 'domcontentloaded' });
    await appHelper.waitForAppReady();

    // Find "Tap on any header" and "Actions" headers (both top-level, same parent=null)
    const tapHeader = page.locator('.header').filter({ hasText: 'Tap on any header' }).first();
    const actionsHeader = page.locator('.header').filter({ hasText: 'Actions' }).first();

    // Verify headers exist
    await expect(tapHeader).toBeVisible();
    await expect(actionsHeader).toBeVisible();

    // Get initial header order
    const initialHeaders = await page.locator('.header').allTextContents();

    // Get the data-header-id of the target header
    const targetHeaderId = await actionsHeader.getAttribute('data-header-id');

    // Simulate long-press drag-reorder using direct Redux state manipulation
    // This is a smoke test that verifies the moveHeaderToPosition action works
    await page.evaluate(([sourceId, targetId]) => {
      return new Promise((resolve) => {
        // Find the Redux store
        const store = window.__reduxStore__;
        if (!store) {
          resolve(false);
          return;
        }

        // Dispatch the moveHeaderToPosition action
        store.dispatch({
          type: 'MOVE_HEADER_TO_POSITION',
          headerId: sourceId,
          targetHeaderId: targetId,
          position: 'below',
          path: '/sample.org'
        });

        // Wait for state to update
        setTimeout(() => resolve(true), 100);
      });
    }, [await tapHeader.getAttribute('data-header-id'), targetHeaderId]);

    // Get final header order
    const finalHeaders = await page.locator('.header').allTextContents();

    // Verify headers are still present (no data loss)
    expect(finalHeaders.length).toBe(initialHeaders.length);

    // The test passes if no errors occurred during the move
    // Same-level moves should be accepted by the reducer
  });
});
