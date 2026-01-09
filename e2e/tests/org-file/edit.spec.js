import { test, expect } from '@playwright/test';

// Helper function to click on the click-catcher wrapper elements
// These elements may not be visible to Playwright, so we dispatch click events directly
// Works with both data-id and data-testid attributes
async function clickClickCatcherButton(page, selectorValue, selectorType = 'id') {
  await page.evaluate((value) => {
    const element =
      document.querySelector(`[data-id="${value}"]`) ||
      document.querySelector(`[data-testid="${value}"]`);
    if (element) {
      element.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    }
  }, selectorValue);
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

  test('should add multiple tags to a header', async ({ page }) => {
    const tablesHeader = page.locator('.header').filter({ hasText: 'Tables' }).first();

    // Scroll into view and click on the header to select it
    await tablesHeader.scrollIntoViewIfNeeded();
    await tablesHeader.click();

    // Wait for the header action drawer to appear
    const actionDrawer = page.locator('[data-testid="header-action-drawer"]');
    await expect(actionDrawer).toBeVisible();

    // Click on the tags icon to open the tags editor
    await clickClickCatcherButton(page, 'drawer-action-tags');

    // Wait for the tags editor modal to open
    await expect(page.locator('[data-testid="tags-editor-modal-title"]')).toBeVisible();

    // Click on the first tag "cute"
    const cuteTag = page
      .locator('[data-testid^="tags-editor-tag-"]')
      .filter({ hasText: 'cute' })
      .first();
    await cuteTag.click();

    // Verify the first tag is now marked as "in use"
    await expect(cuteTag).toHaveAttribute('data-in-use', 'true');

    // Click on a second tag if available (try "work" or any other existing tag)
    // Look for other available tags in the tags editor
    const workTag = page
      .locator('[data-testid^="tags-editor-tag-"]')
      .filter({ hasText: 'work' })
      .first();

    // If "work" tag exists, click it and verify it's marked as in use
    const workTagCount = await workTag.count();
    if (workTagCount > 0) {
      await workTag.click();
      await expect(workTag).toHaveAttribute('data-in-use', 'true');
    }

    // Close and re-open the tags editor to verify tags are marked as in-use
    await clickClickCatcherButton(page, 'drawer-action-edit-title');
    await expect(page.locator('[data-testid="tags-editor-modal-title"]')).not.toBeVisible();

    // Close the drawer by clicking outside
    await page.locator('[data-testid="drawer-outer-container"]').first().click();
    await expect(page.locator('[data-testid="drawer-outer-container"]')).not.toBeVisible({
      timeout: 5000,
    });

    // Re-open the tags editor to verify the tags persisted
    await tablesHeader.click();
    await clickClickCatcherButton(page, 'drawer-action-tags');
    await expect(page.locator('[data-testid="tags-editor-modal-title"]')).toBeVisible();
    await expect(page.locator('[data-testid="tags-editor-tag-cute"]')).toHaveAttribute(
      'data-in-use',
      'true'
    );

    // If we added a second tag, verify it too
    if (workTagCount > 0) {
      await expect(page.locator('[data-testid="tags-editor-tag-work"]')).toHaveAttribute(
        'data-in-use',
        'true'
      );
    }
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

test.describe('Planning Items (Timestamps)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/sample', { waitUntil: 'domcontentloaded' });
    // Wait for the sample content to load by checking for specific text
    await expect(page.getByText('This is an actual org file')).toBeVisible();
  });

  test('should set deadline datetime for a header', async ({ page }) => {
    const tablesHeader = page.locator('.header').filter({ hasText: 'Tables' }).first();

    // Scroll into view and click on the header to select it
    await tablesHeader.scrollIntoViewIfNeeded();
    await tablesHeader.click();

    // Wait for the header action drawer to appear
    const actionDrawer = page.locator('[data-testid="header-action-drawer"]');
    await expect(actionDrawer).toBeVisible();

    // Click on the deadline button (calendar-check icon)
    await clickClickCatcherButton(page, 'drawer-action-deadline');

    // Wait for the deadline editor modal to open
    await expect(page.locator('.timestamp-editor__title:has-text("Edit deadline")')).toBeVisible();

    // When there's no existing deadline, we need to click "Add Timestamp" first
    const addTimestampButton = page.locator('.timestamp-editor__icon--add').first();
    if (await addTimestampButton.isVisible()) {
      await addTimestampButton.click();
    }

    // Set a date by selecting the 15th of the current month using the date input
    const dateInput = page.locator('[data-testid="timestamp-selector"]');
    // Get current date to construct a valid date string (15th of current month)
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = '15';
    await dateInput.fill(`${year}-${month}-${day}`);

    // Switch to title editor to save the deadline (similar to how tags test does it)
    await clickClickCatcherButton(page, 'drawer-action-edit-title');

    // Wait for the title editor to open (confirms deadline was saved)
    await expect(page.locator('.drawer-modal__title:has-text("Edit title")')).toBeVisible();

    // Close the drawer by clicking outside
    await page.locator('[data-testid="drawer-outer-container"]').first().click();

    // Wait for the drawer to close
    await expect(page.locator('[data-testid="drawer-outer-container"]')).not.toBeVisible({
      timeout: 5000,
    });

    // Verify DEADLINE: appears with the date on the header
    await expect(page.locator('text=DEADLINE:')).toBeVisible();

    // Re-open the header to verify the deadline persisted
    await tablesHeader.click();
    await expect(actionDrawer).toBeVisible();

    // Click deadline button again to verify the date is still set
    await clickClickCatcherButton(page, 'drawer-action-deadline');
    await expect(page.locator('.timestamp-editor__title:has-text("Edit deadline")')).toBeVisible();

    // Verify the date input still has our selected date
    const dateInputVerify = page.locator('[data-testid="timestamp-selector"]');
    await expect(dateInputVerify).toHaveValue(`${year}-${month}-${day}`);
  });

  test('should set scheduled datetime for a header', async ({ page }) => {
    const tablesHeader = page.locator('.header').filter({ hasText: 'Tables' }).first();

    // Scroll into view and click on the header to select it
    await tablesHeader.scrollIntoViewIfNeeded();
    await tablesHeader.click();

    // Wait for the header action drawer to appear
    const actionDrawer = page.locator('[data-testid="header-action-drawer"]');
    await expect(actionDrawer).toBeVisible();

    // Click on the scheduled button (calendar icon 2)
    await clickClickCatcherButton(page, 'drawer-action-scheduled');

    // Wait for the scheduled editor modal to open
    await expect(
      page.locator('.timestamp-editor__title:has-text("Edit scheduled timestamp")')
    ).toBeVisible();

    // When there's no existing scheduled date, we need to click "Add Timestamp" first
    const addTimestampButton = page.locator('.timestamp-editor__icon--add').first();
    if (await addTimestampButton.isVisible()) {
      await addTimestampButton.click();
    }

    // Set a date by selecting the 20th of the current month using the date input
    const dateInput = page.locator('[data-testid="timestamp-selector"]');
    // Get current date to construct a valid date string (20th of current month)
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = '20';
    await dateInput.fill(`${year}-${month}-${day}`);

    // Switch to title editor to save the scheduled date (similar to how tags test does it)
    await clickClickCatcherButton(page, 'drawer-action-edit-title');

    // Wait for the title editor to open (confirms scheduled date was saved)
    await expect(page.locator('.drawer-modal__title:has-text("Edit title")')).toBeVisible();

    // Close the drawer by clicking outside
    await page.locator('[data-testid="drawer-outer-container"]').first().click();

    // Wait for the drawer to close
    await expect(page.locator('[data-testid="drawer-outer-container"]')).not.toBeVisible({
      timeout: 5000,
    });

    // Verify SCHEDULED: appears with the date on the header
    await expect(page.locator('text=SCHEDULED:')).toBeVisible();

    // Re-open the header to verify the scheduled date persisted
    await tablesHeader.click();
    await expect(actionDrawer).toBeVisible();

    // Click scheduled button again to verify the date is still set
    await clickClickCatcherButton(page, 'drawer-action-scheduled');
    await expect(
      page.locator('.timestamp-editor__title:has-text("Edit scheduled timestamp")')
    ).toBeVisible();

    // Verify the date input still has our selected date
    const dateInputVerify = page.locator('[data-testid="timestamp-selector"]');
    await expect(dateInputVerify).toHaveValue(`${year}-${month}-${day}`);
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

test.describe('Clocking', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/sample', { waitUntil: 'domcontentloaded' });
    // Wait for the sample content to load by checking for specific text
    await expect(page.getByText('This is an actual org file')).toBeVisible();
  });

  test('should clock in and out on a header', async ({ page }) => {
    // Use the Tables header which is reliably found in other tests
    const targetHeader = page.locator('.header').filter({ hasText: 'Tables' }).first();

    // Scroll into view and click on the header to select it
    await targetHeader.scrollIntoViewIfNeeded();
    await targetHeader.click();

    // Wait for the header action drawer to appear
    const actionDrawer = page.locator('[data-testid="header-action-drawer"]');
    await expect(actionDrawer).toBeVisible();

    // Click on the clock in button (hourglass-start icon)
    await clickClickCatcherButton(page, 'org-clock-in');

    // Verify button changes to clock out (hourglass-end icon)
    // Use waitForSelector with 'attached' state because the button is in a click-catcher wrapper
    await page.waitForSelector('[data-testid="org-clock-out"]', {
      state: 'attached',
      timeout: 5000,
    });
    // Verify the clock in button is no longer present
    await expect(page.locator('[data-testid="org-clock-in"]')).toHaveCount(0);

    // The drawer might close automatically after clock in, so first wait for it to potentially close
    await page.waitForTimeout(500);

    // If drawer is still visible, close it by clicking outside
    const drawerOuter = page.locator('[data-testid="drawer-outer-container"]');
    if (await drawerOuter.isVisible()) {
      await drawerOuter.first().click();
    }

    // Wait for the drawer to be fully closed
    await expect(page.locator('[data-testid="drawer-outer-container"]')).not.toBeVisible({
      timeout: 5000,
    });

    // Verify :LOGBOOK: appears indicating clock is running
    await expect(page.locator('text=:LOGBOOK:')).toBeVisible();

    // Re-open the header
    await targetHeader.click();
    await expect(actionDrawer).toBeVisible();

    // Click clock out button (hourglass-end icon)
    await clickClickCatcherButton(page, 'org-clock-out');

    // Verify the button changed back to clock in
    // Use waitForSelector with 'attached' state because the button is in a click-catcher wrapper
    await page.waitForSelector('[data-testid="org-clock-in"]', {
      state: 'attached',
      timeout: 5000,
    });
    // Verify the clock out button is no longer present
    await expect(page.locator('[data-testid="org-clock-out"]')).toHaveCount(0);

    // The drawer might close automatically after clock out, so wait and check
    await page.waitForTimeout(500);

    // If drawer is still visible, close it by clicking outside
    // Use page.evaluate for Firefox compatibility
    await page.evaluate(() => {
      const drawerOuter = document.querySelector('[data-testid="drawer-outer-container"]');
      if (drawerOuter) {
        drawerOuter.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
      }
    });

    await expect(page.locator('[data-testid="drawer-outer-container"]')).not.toBeVisible({
      timeout: 5000,
    });

    // Verify :LOGBOOK: is still visible (with the clock entry)
    await expect(page.locator('text=:LOGBOOK:')).toBeVisible();

    // Click on the LOGBOOK to expand it and see the CLOCK: entry
    await page.locator('text=:LOGBOOK:').click();

    // Verify CLOCK: entry appears in the logbook
    await expect(page.locator('text=CLOCK:')).toBeVisible();
  });
});

test.describe('Header Properties', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/sample', { waitUntil: 'domcontentloaded' });
    // Wait for the sample content to load by checking for specific text
    await expect(page.getByText('This is an actual org file')).toBeVisible();
  });

  test('should edit header properties', async ({ page }) => {
    const tablesHeader = page.locator('.header').filter({ hasText: 'Tables' }).first();

    // Scroll into view and click on the header to select it
    await tablesHeader.scrollIntoViewIfNeeded();
    await tablesHeader.click();

    // Wait for the header action drawer to appear
    const actionDrawer = page.locator('[data-testid="header-action-drawer"]');
    await expect(actionDrawer).toBeVisible();

    // Click on the properties icon to open the properties editor
    await clickClickCatcherButton(page, 'drawer-action-properties');

    // Wait for the properties editor modal to open
    await expect(page.locator('[data-testid="property-list-editor-title"]')).toBeVisible();

    // Initially, there should be no items message
    await expect(page.locator('[data-testid="property-list-editor-no-items"]')).toBeVisible();

    // Click the plus button to add a new property
    const addButton = page.locator('[data-testid="property-list-editor-add-button"]');
    await addButton.click();

    // Fill in the property name (first input - index 0)
    const propertyNameInput = page.locator('[data-testid="property-list-editor-property-name-0"]');
    await propertyNameInput.fill('TestProperty');

    // Fill in the property value (second input - index 0)
    const propertyValueInput = page.locator(
      '[data-testid="property-list-editor-property-value-0"]'
    );
    await propertyValueInput.fill('TestValue');

    // Save by switching to title editor (this should save the properties)
    await clickClickCatcherButton(page, 'drawer-action-edit-title');

    // Wait for the title editor to open (confirms the switch happened)
    await expect(page.locator('.drawer-modal__title:has-text("Edit title")')).toBeVisible();

    // Close the drawer by clicking outside
    await page.locator('[data-testid="drawer-outer-container"]').first().click();

    // Wait for the drawer to close
    await expect(page.locator('[data-testid="drawer-outer-container"]')).not.toBeVisible({
      timeout: 5000,
    });

    // Verify the property appears on the header
    // Properties are displayed in a collapsed :PROPERTIES:... block by default
    await expect(page.locator('[data-testid="property-list-properties-toggle"]')).toBeVisible();

    // Click on the :PROPERTIES: block to expand and see the individual properties
    await page.locator('[data-testid="property-list-properties-toggle"]').click();

    // Verify the individual property is now visible
    await expect(page.locator('[data-testid="property-list-item-property-0"]')).toBeVisible();
    await expect(page.locator('[data-testid="property-list-item-property-0"]')).toHaveText(
      ':TestProperty:'
    );

    // Re-open the properties editor to verify the property persists
    await tablesHeader.click();
    await clickClickCatcherButton(page, 'drawer-action-properties');
    await expect(page.locator('[data-testid="property-list-editor-title"]')).toBeVisible();

    // Verify the property is still there
    const savedPropertyNameInput = page.locator(
      '[data-testid="property-list-editor-property-name-0"]'
    );
    const savedPropertyValueInput = page.locator(
      '[data-testid="property-list-editor-property-value-0"]'
    );
    await expect(savedPropertyNameInput).toHaveValue('TestProperty');
    await expect(savedPropertyValueInput).toHaveValue('TestValue');
  });
});
