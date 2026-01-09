import { test, expect } from '@playwright/test';

// Helper function to click on the click-catcher wrapper elements
// These elements may not be visible to Playwright, so we dispatch click events directly
async function clickClickCatcherButton(page, selector) {
  await page.evaluate((sel) => {
    const element = document.querySelector(sel);
    if (element) {
      element.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    }
  }, selector);
}

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
    // Use page.evaluate to dispatch click event directly on the click-catcher wrapper
    await clickClickCatcherButton(
      page,
      '.header-action-drawer__ff-click-catcher-container:has([data-testid="drawer-action-tags"])'
    );

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
    await clickClickCatcherButton(
      page,
      '[data-testid="drawer"] .header-action-drawer__ff-click-catcher-container:has([data-testid="drawer-action-edit-title"])'
    );

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
    await clickClickCatcherButton(
      page,
      '.header-action-drawer__ff-click-catcher-container:has([data-testid="drawer-action-tags"])'
    );
    await expect(page.locator('[data-testid="tags-editor-modal-title"]')).toBeVisible();
    await expect(page.locator('[data-testid="tags-editor-tag-cute"]')).toHaveAttribute(
      'data-in-use',
      'true'
    );
  });
});

test.describe('Header Title', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/sample', { waitUntil: 'domcontentloaded' });
    // Wait for the sample content to load by checking for specific text
    await expect(page.getByText('This is an actual org file')).toBeVisible();
  });

  test('should edit header title', async ({ page }) => {
    const tablesHeader = page.locator('.header').filter({ hasText: 'Tables' }).first();

    // Scroll into view and click on the header to select it
    await tablesHeader.scrollIntoViewIfNeeded();
    await tablesHeader.click();

    // Wait for the header action drawer to appear
    const actionDrawer = page.locator('[data-testid="header-action-drawer"]');
    await expect(actionDrawer).toBeVisible();

    // Click on the edit title button
    // Use page.evaluate to dispatch click event directly on the click-catcher wrapper
    await clickClickCatcherButton(
      page,
      '.header-action-drawer__ff-click-catcher-container:has([data-testid="drawer-action-edit-title"])'
    );

    // Wait for the title editor modal to open - check for drawer-modal__title text
    await expect(page.locator('.drawer-modal__title:has-text("Edit title")')).toBeVisible();

    // Change the title to "Updated Tables Title"
    // The data-testid is "titleLineInput" not "title-editor-input"
    const titleInput = page.locator('[data-testid="titleLineInput"]');
    await titleInput.fill('Updated Tables Title');

    // Save by pressing Enter (the title editor saves on newline)
    await titleInput.press('Enter');

    // Wait for the drawer to close
    await expect(page.locator('[data-testid="drawer-outer-container"]')).not.toBeVisible({
      timeout: 5000,
    });

    // Verify the new title appears on the header
    const updatedHeader = page.locator('.header').filter({ hasText: 'Updated Tables Title' });
    await expect(updatedHeader).toBeVisible();

    // Re-open the header to verify the title persists
    await updatedHeader.first().click();
    await expect(actionDrawer).toBeVisible();
    await clickClickCatcherButton(
      page,
      '.header-action-drawer__ff-click-catcher-container:has([data-testid="drawer-action-edit-title"])'
    );
    await expect(page.locator('.drawer-modal__title:has-text("Edit title")')).toBeVisible();
    // Re-locate the title input as it's a new element
    const titleInputVerify = page.locator('[data-testid="titleLineInput"]');
    await expect(titleInputVerify).toHaveValue('Updated Tables Title');
  });
});
