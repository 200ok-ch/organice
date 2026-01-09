import { test, expect } from '@playwright/test';

// Helper function to click on the click-catcher wrapper elements
// These elements may not be visible to Playwright, so we dispatch click events directly
async function clickClickCatcherButton(page, dataId) {
  await page.evaluate((id) => {
    const element = document.querySelector(`[data-id="${id}"]`);
    if (element) {
      element.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    }
  }, dataId);
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
    await clickClickCatcherButton(page, 'drawer-action-tags');

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
    await clickClickCatcherButton(page, 'drawer-action-edit-title');

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
    await clickClickCatcherButton(page, 'drawer-action-tags');
    await expect(page.locator('[data-testid="tags-editor-modal-title"]')).toBeVisible();
    await expect(page.locator('[data-testid="tags-editor-tag-cute"]')).toHaveAttribute(
      'data-in-use',
      'true'
    );
  });

  test('should remove a tag from a header', async ({ page }) => {
    // Helper function to expand a header and close its drawer
    const expandAndCloseDrawer = async (headerLocator) => {
      await headerLocator.scrollIntoViewIfNeeded();
      await headerLocator.click();
      // Wait for header action drawer to appear
      await expect(page.locator('[data-testid="header-action-drawer"]')).toBeVisible();
      // Close by clicking on the "Sample" link to deselect
      await page.getByText('Sample').click();
      // Wait for drawer to close
      await expect(page.locator('[data-testid="header-action-drawer"]')).toHaveCount(0, {
        timeout: 5000,
      });
    };

    // First, expand the "Actions" section (level 1 header) to reveal its children
    const actionsHeader = page.locator('.header').filter({ hasText: 'Actions' }).first();
    await expandAndCloseDrawer(actionsHeader);

    // Then expand the "Tags" section (level 2 header under Actions)
    const tagsSectionHeader = page.locator('.header').filter({ hasText: 'Tags' }).first();
    await expandAndCloseDrawer(tagsSectionHeader);

    // Then expand the "Dogs" section (level 3 header under Tags)
    const dogsHeader = page.locator('.header').filter({ hasText: 'Dogs' }).first();
    await expandAndCloseDrawer(dogsHeader);

    // Now find and click on the Eloise header (level 4 header)
    const eloiseHeader = page.locator('.header').filter({ hasText: 'Eloise' }).first();
    await eloiseHeader.click();

    // Wait for the header action drawer to appear
    const actionDrawer = page.locator('[data-testid="header-action-drawer"]');
    await expect(actionDrawer).toBeVisible();

    // Click on the tags icon to open the tags editor
    await clickClickCatcherButton(page, 'drawer-action-tags');

    // Wait for the tags editor modal to open
    await expect(page.locator('[data-testid="tags-editor-modal-title"]')).toBeVisible();

    // Find and click on the "tiny" tag to remove it
    const tinyTag = page.locator('[data-testid="tags-editor-tag-tiny"]');
    await expect(tinyTag).toHaveAttribute('data-in-use', 'true');
    await tinyTag.click();

    // Verify the tag is now marked as "not in use"
    await expect(tinyTag).toHaveAttribute('data-in-use', 'false');

    // Close the drawer by switching to title editor (this should save the changes)
    await clickClickCatcherButton(page, 'drawer-action-edit-title');

    // Wait for the title editor to open
    await expect(page.locator('[data-testid="tags-editor-modal-title"]')).not.toBeVisible();

    // Close the drawer by clicking outside
    await page.locator('[data-testid="drawer-outer-container"]').first().click();

    // Wait for the drawer to close
    await expect(page.locator('[data-testid="drawer-outer-container"]')).not.toBeVisible({
      timeout: 5000,
    });

    // Verify the "tiny" tag is no longer displayed on the header
    const headerTags = page.locator('.header').filter({ hasText: 'Eloise' }).first();
    await expect(headerTags).not.toHaveText(/:.*tiny:.*/);

    // Re-open the tags editor to verify the removal persisted
    await eloiseHeader.click();
    await clickClickCatcherButton(page, 'drawer-action-tags');
    await expect(page.locator('[data-testid="tags-editor-modal-title"]')).toBeVisible();
    await expect(page.locator('[data-testid="tags-editor-tag-tiny"]')).toHaveAttribute(
      'data-in-use',
      'false'
    );
  });
});

test.describe('Header Description', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/sample', { waitUntil: 'domcontentloaded' });
    // Wait for the sample content to load by checking for specific text
    await expect(page.getByText('This is an actual org file')).toBeVisible();
  });

  test('should edit header description', async ({ page }) => {
    const tapHeader = page
      .locator('.header')
      .filter({ hasText: 'Tap on any header to open it' })
      .first();

    // Scroll into view and click on the header to select it
    await tapHeader.scrollIntoViewIfNeeded();
    await tapHeader.click();

    // Wait for the header action drawer to appear
    const actionDrawer = page.locator('[data-testid="header-action-drawer"]');
    await expect(actionDrawer).toBeVisible();

    // Click on the edit description button (pen in square icon)
    // The data-id is 'edit-header-title' (this appears to be the description editor button)
    await clickClickCatcherButton(page, 'edit-header-title');

    // Wait for the description editor modal to open
    await expect(page.locator('.drawer-modal__title:has-text("Edit description")')).toBeVisible();

    // Type new description (note: textarea value may have trailing newline)
    const descriptionTextarea = page.locator('.header-content__edit-container textarea');
    const newDescription = 'This is an updated description for testing purposes.';
    await descriptionTextarea.fill(newDescription);

    // Save by clicking outside the drawer (on the drawer outer container)
    await page.locator('[data-testid="drawer-outer-container"]').first().click();

    // Wait for the drawer to close
    await expect(page.locator('[data-testid="drawer-outer-container"]')).not.toBeVisible({
      timeout: 5000,
    });

    // Verify the new description appears below the header
    const headerWithDescription = page
      .locator('.header')
      .filter({ hasText: 'Tap on any header to open it' })
      .first();
    await expect(headerWithDescription.locator('..')).toContainText(newDescription);

    // Re-open the header to verify the description persists
    await tapHeader.click();
    await expect(actionDrawer).toBeVisible();
    await clickClickCatcherButton(page, 'edit-header-title');
    await expect(page.locator('.drawer-modal__title:has-text("Edit description")')).toBeVisible();
    // Re-locate the textarea as it's a new element
    // Note: textarea value includes trailing newline from the editor
    const descriptionTextareaVerify = page.locator('.header-content__edit-container textarea');
    const textareaValue = await descriptionTextareaVerify.inputValue();
    expect(textareaValue.trim()).toBe(newDescription);
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
    await clickClickCatcherButton(page, 'drawer-action-edit-title');

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
    await clickClickCatcherButton(page, 'drawer-action-edit-title');
    await expect(page.locator('.drawer-modal__title:has-text("Edit title")')).toBeVisible();
    // Re-locate the title input as it's a new element
    const titleInputVerify = page.locator('[data-testid="titleLineInput"]');
    await expect(titleInputVerify).toHaveValue('Updated Tables Title');
  });
});
