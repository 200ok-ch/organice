import { test, expect } from '@playwright/test';

test.describe('Header Tags', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/sample', { waitUntil: 'domcontentloaded' });
    // Wait for the sample content to load by checking for specific text
    await expect(page.getByText('This is an actual org file')).toBeVisible();
  });

  test('should add a tag to a header', async ({ page }) => {
    const tablesHeader = page.locator('.header').filter({ hasText: 'Tables' }).first();

    // Scroll into view and click on the header to select it
    await tablesHeader.scrollIntoViewIfNeeded();
    await tablesHeader.click();

    // Wait for the header action drawer to appear
    const actionDrawer = page.locator('[data-testid="header-action-drawer"]');
    await expect(actionDrawer).toBeVisible();

    // Click on the tags icon to open the tags editor
    // Note: Need to click the container div due to click-catcher wrapper
    const tagsButton = page.locator(
      '.header-action-drawer__ff-click-catcher-container:has([data-testid="drawer-action-tags"])'
    );
    await tagsButton.click();

    // Wait for the tags editor modal to open
    await expect(page.locator('[data-testid="tags-editor-modal-title"]')).toBeVisible();

    // Click on an existing tag from the "All tags" section
    // This is more reliable than typing into a new tag input
    const existingTag = 'cute'; // This tag exists in sample.org (Dogs section)
    const tagToClick = page
      .locator('[data-testid^="tags-editor-tag-"]')
      .filter({ hasText: existingTag })
      .first();
    await tagToClick.click();

    // Verify the tag is now marked as "in use" using the data-in-use attribute
    await expect(tagToClick).toHaveAttribute('data-in-use', 'true');

    // Close the drawer by switching to title editor (this should save the tags)
    // Click on the pencil icon (edit title) button in the drawer action bar
    // Note: The tags editor modal has its own action bar at the bottom
    const titleEditButton = page.locator(
      '[data-testid="drawer"] .header-action-drawer__ff-click-catcher-container:has([data-testid="drawer-action-edit-title"])'
    );
    await titleEditButton.click();

    // Wait for the title editor to open (confirms the switch happened)
    await expect(page.locator('[data-testid="tags-editor-modal-title"]')).not.toBeVisible();

    // Close the drawer by clicking outside
    await page.locator('[data-testid="drawer-outer-container"]').first().click();

    // Wait for the drawer to close
    await expect(page.locator('[data-testid="drawer-outer-container"]')).not.toBeVisible({
      timeout: 5000,
    });

    // Verify the tag appears on the header
    // The tag should be displayed as `cute` at the end of the title line
    await expect(page.locator('text=cute')).toBeVisible();
    // Re-open the tags editor to verify the tag was saved
    await tablesHeader.click();
    await tagsButton.click();
    await expect(page.locator('[data-testid="tags-editor-modal-title"]')).toBeVisible();
    await expect(page.locator('[data-testid="tags-editor-tag-cute"]')).toHaveAttribute(
      'data-in-use',
      'true'
    );
  });
});
