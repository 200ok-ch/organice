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

test.describe('TODO States', () => {
  // Run tests serially to avoid state interference
  test.describe.configure({ mode: 'serial' });
  test.beforeEach(async ({ page }) => {
    await page.goto('/sample', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText('This is an actual org file')).toBeVisible();
  });

  test('should advance TODO state by swiping right', async ({ page }) => {
    // "Todos" is nested under "Actions" - need to expand both
    const actionsHeader = page.locator('.header').filter({ hasText: 'Actions' }).first();
    await actionsHeader.click();
    await page.waitForTimeout(500);

    // Close the Actions drawer
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    const todosHeader = page.locator('.header').filter({ hasText: 'Todos' }).first();
    await todosHeader.scrollIntoViewIfNeeded();
    await expect(todosHeader).toBeVisible();
    await todosHeader.click();
    await page.waitForTimeout(500);

    // Close the Todos drawer
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    // Find the child TODO header
    const todoHeader = page
      .locator('.header')
      .filter({ hasText: 'Learn how to use TODOs in organice' })
      .first();
    await todoHeader.scrollIntoViewIfNeeded();

    // Get bounding box for swipe gesture
    const box = await todoHeader.boundingBox();
    expect(box).toBeTruthy();

    // Perform swipe right gesture
    await page.mouse.move(box.x + 10, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 2, box.y + box.height / 2);
    await page.mouse.up();

    // Wait for the state change to take effect
    await page.waitForTimeout(500);

    // Verify TODO state advanced to DONE
    const doneHeader = page
      .locator('.header')
      .filter({ hasText: 'Learn how to use TODOs in organice' })
      .first();
    await expect(doneHeader).toBeVisible();

    // Verify the DONE state has the green color class
    const todoKeyword = doneHeader.locator('.todo-keyword');
    await expect(todoKeyword).toHaveClass(/todo-keyword--done-state/);
  });
});
