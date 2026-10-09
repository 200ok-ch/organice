import { test, expect } from '@playwright/test';
import AppHelper from '../../helpers/app-helper.js';
import FirefoxHelper from '../../helpers/firefox-helper.js';

test.describe('Header Tags', () => {
  let appHelper;
  let firefoxHelper;

  test.beforeEach(async ({ page }) => {
    appHelper = new AppHelper(page);
    firefoxHelper = new FirefoxHelper(page);

    await page.goto('/sample', { waitUntil: 'domcontentloaded' });
    await appHelper.waitForAppReady();
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
    await firefoxHelper.clickClickCatcherButton('drawer-action-tags');

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
    await firefoxHelper.clickClickCatcherButton('drawer-action-edit-title');

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
    await firefoxHelper.clickClickCatcherButton('drawer-action-tags');
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
    await firefoxHelper.clickClickCatcherButton('drawer-action-tags');

    // Wait for the tags editor modal to open
    await expect(page.locator('[data-testid="tags-editor-modal-title"]')).toBeVisible();

    // Find and click on the "tiny" tag to remove it
    const tinyTag = page.locator('[data-testid="tags-editor-tag-tiny"]');
    await expect(tinyTag).toHaveAttribute('data-in-use', 'true');
    await tinyTag.click();

    // Verify the tag is now marked as "not in use"
    await expect(tinyTag).toHaveAttribute('data-in-use', 'false');

    // Close the drawer by switching to title editor (this should save the changes)
    await firefoxHelper.clickClickCatcherButton('drawer-action-edit-title');

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
    await firefoxHelper.clickClickCatcherButton('drawer-action-tags');
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
    await firefoxHelper.clickClickCatcherButton('drawer-action-tags');

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
    await firefoxHelper.clickClickCatcherButton('drawer-action-edit-title');
    await expect(page.locator('[data-testid="tags-editor-modal-title"]')).not.toBeVisible();

    // Close the drawer by clicking outside
    await page.locator('[data-testid="drawer-outer-container"]').first().click();
    await expect(page.locator('[data-testid="drawer-outer-container"]')).not.toBeVisible({
      timeout: 5000,
    });

    // Re-open the tags editor to verify the tags persisted
    await tablesHeader.click();
    await firefoxHelper.clickClickCatcherButton('drawer-action-tags');
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
  let appHelper;
  let firefoxHelper;

  test.beforeEach(async ({ page }) => {
    appHelper = new AppHelper(page);
    firefoxHelper = new FirefoxHelper(page);

    await page.goto('/sample', { waitUntil: 'domcontentloaded' });
    await appHelper.waitForAppReady();
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
    await firefoxHelper.clickClickCatcherButton('edit-header-title');

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
    await firefoxHelper.clickClickCatcherButton('edit-header-title');
    await expect(page.locator('.drawer-modal__title:has-text("Edit description")')).toBeVisible();
    // Re-locate the textarea as it's a new element
    // Note: textarea value includes trailing newline from the editor
    const descriptionTextareaVerify = page.locator('.header-content__edit-container textarea');
    const textareaValue = await descriptionTextareaVerify.inputValue();
    expect(textareaValue.trim()).toBe(newDescription);
  });
});

test.describe('Description List Auto-Continuation', () => {
  let appHelper;
  let firefoxHelper;

  test.beforeEach(async ({ page }) => {
    appHelper = new AppHelper(page);
    firefoxHelper = new FirefoxHelper(page);

    await page.goto('/sample', { waitUntil: 'domcontentloaded' });
    await appHelper.waitForAppReady();
  });

  // Helper to open the description editor on the "Tables" header
  async function openDescriptionEditor(page, firefoxHelper) {
    const tablesHeader = page.locator('.header').filter({ hasText: 'Tables' }).first();
    await tablesHeader.scrollIntoViewIfNeeded();
    await tablesHeader.click();
    await expect(page.locator('[data-testid="header-action-drawer"]')).toBeVisible();
    await firefoxHelper.clickClickCatcherButton('edit-header-title');
    await expect(page.locator('.drawer-modal__title:has-text("Edit description")')).toBeVisible();
    return page.locator('[data-testid="description-textarea"]');
  }

  test('should auto-continue unordered list with dash on Enter', async ({ page }) => {
    const textarea = await openDescriptionEditor(page, firefoxHelper);

    // Clear the textarea and type a list item
    await textarea.fill('');
    await textarea.click();
    await textarea.type('- item one');
    await textarea.press('Enter');

    // Verify the next line starts with "- "
    const value = await textarea.inputValue();
    expect(value).toBe('- item one\n- ');
  });

  test('should auto-continue unordered list with dash and checkbox on Enter', async ({ page }) => {
    const textarea = await openDescriptionEditor(page, firefoxHelper);

    // Clear the textarea and type a list item
    await textarea.fill('');
    await textarea.click();
    await textarea.type('- [ ] item one');
    await textarea.press('Enter');

    // Verify the next line starts with "- "
    const value = await textarea.inputValue();
    expect(value).toBe('- [ ] item one\n- [ ] ');
  });

  test('should auto-continue ordered list on Enter', async ({ page }) => {
    const textarea = await openDescriptionEditor(page, firefoxHelper);

    // Clear and type an ordered list item
    await textarea.fill('');
    await textarea.click();
    await textarea.type('1. first item');
    await textarea.press('Enter');

    // Verify the next line starts with "2. "
    const value = await textarea.inputValue();
    expect(value).toBe('1. first item\n2. ');
  });

  test('should exit unordered list when pressing Enter on empty item', async ({ page }) => {
    const textarea = await openDescriptionEditor(page, firefoxHelper);

    // Clear and type a list item, then Enter twice
    await textarea.fill('');
    await textarea.click();
    await textarea.type('- item one');
    await textarea.press('Enter');
    // Now cursor is after "- " on the second line — press Enter again to exit
    await textarea.press('Enter');

    // The empty "- " should be removed, leaving just the first item with a trailing newline
    const value = await textarea.inputValue();
    expect(value).toBe('- item one\n');
  });

  test('should exit ordered list when pressing Enter on empty item', async ({ page }) => {
    const textarea = await openDescriptionEditor(page, firefoxHelper);

    // Clear and type an ordered list item, then Enter twice
    await textarea.fill('');
    await textarea.click();
    await textarea.type('1. first item');
    await textarea.press('Enter');
    // Now cursor is after "2. " on the second line — press Enter again to exit
    await textarea.press('Enter');

    // The empty "2. " should be removed
    const value = await textarea.inputValue();
    expect(value).toBe('1. first item\n');
  });
});

test.describe('Planning Items (Timestamps)', () => {
  let appHelper;
  let firefoxHelper;

  test.beforeEach(async ({ page }) => {
    appHelper = new AppHelper(page);
    firefoxHelper = new FirefoxHelper(page);

    await page.goto('/sample', { waitUntil: 'domcontentloaded' });
    await appHelper.waitForAppReady();
  });

  test('should set deadline timestamp', async ({ page }) => {
    const tablesHeader = page.locator('.header').filter({ hasText: 'Tables' }).first();

    // Scroll into view and click on the header to select it
    await tablesHeader.scrollIntoViewIfNeeded();
    await tablesHeader.click();

    // Wait for the header action drawer to appear
    const actionDrawer = page.locator('[data-testid="header-action-drawer"]');
    await expect(actionDrawer).toBeVisible();

    // Click on the deadline button to open the deadline editor
    await firefoxHelper.clickClickCatcherButton('drawer-action-deadline');

    // Wait for the timestamp editor to appear (it shows "Add Timestamp" initially)
    // The timestamp editor modal title is "Edit deadline"
    await expect(page.locator('.timestamp-editor__title:has-text("Edit deadline")')).toBeVisible();

    // Click the plus icon to add a new timestamp
    await page.locator('.timestamp-editor__icon--add').first().click();

    // Now set the date using the timestamp-selector input
    const dateInput = page.locator('[data-testid="timestamp-selector"]');
    const currentDate = await dateInput.inputValue();

    // Set date to the 15th of the current month
    const [year, month] = currentDate.split('-');
    const newDate = `${year}-${month}-15`;
    await dateInput.fill(newDate);

    // Close the drawer by switching to title editor mode
    await firefoxHelper.clickClickCatcherButton('drawer-action-edit-title');

    // Wait for the drawer to close by clicking outside
    await page.locator('[data-testid="drawer-outer-container"]').first().click();

    // Wait for the drawer to close
    await expect(page.locator('[data-testid="drawer-outer-container"]')).not.toBeVisible({
      timeout: 5000,
    });

    // Verify the deadline appears on the header
    // The deadline should be displayed as "DEADLINE: <date>"
    const headerWithDeadline = page.locator('.header').filter({ hasText: 'Tables' }).first();
    await expect(headerWithDeadline.locator('..')).toContainText('DEADLINE:');

    // Re-open the header to verify the deadline persists
    await tablesHeader.click();
    await expect(actionDrawer).toBeVisible();
    await firefoxHelper.clickClickCatcherButton('drawer-action-deadline');
    await expect(page.locator('.timestamp-editor__title:has-text("Edit deadline")')).toBeVisible();

    // Verify the date is still set to the 15th
    const dateInputVerify = page.locator('[data-testid="timestamp-selector"]');
    await expect(dateInputVerify).toHaveValue(newDate);
  });

  test('should set scheduled timestamp', async ({ page }) => {
    const tablesHeader = page.locator('.header').filter({ hasText: 'Tables' }).first();

    // Scroll into view and click on the header to select it
    await tablesHeader.scrollIntoViewIfNeeded();
    await tablesHeader.click();

    // Wait for the header action drawer to appear
    const actionDrawer = page.locator('[data-testid="header-action-drawer"]');
    await expect(actionDrawer).toBeVisible();

    // Click on the scheduled button to open the scheduled editor
    await firefoxHelper.clickClickCatcherButton('drawer-action-scheduled');

    // Wait for the timestamp editor to appear
    // The timestamp editor modal title is "Edit scheduled timestamp"
    await expect(
      page.locator('.timestamp-editor__title:has-text("Edit scheduled timestamp")')
    ).toBeVisible();

    // Click the plus icon to add a new timestamp
    await page.locator('.timestamp-editor__icon--add').first().click();

    // Now set the date using the timestamp-selector input
    const dateInput = page.locator('[data-testid="timestamp-selector"]');
    const currentDate = await dateInput.inputValue();

    // Set date to the 20th of the current month
    const [year, month] = currentDate.split('-');
    const newDate = `${year}-${month}-20`;
    await dateInput.fill(newDate);

    // Close the drawer by switching to title editor mode
    await firefoxHelper.clickClickCatcherButton('drawer-action-edit-title');

    // Wait for the drawer to close by clicking outside
    await page.locator('[data-testid="drawer-outer-container"]').first().click();

    // Wait for the drawer to close
    await expect(page.locator('[data-testid="drawer-outer-container"]')).not.toBeVisible({
      timeout: 5000,
    });

    // Verify the scheduled date appears on the header
    // The scheduled date should be displayed as "SCHEDULED: <date>"
    const headerWithScheduled = page.locator('.header').filter({ hasText: 'Tables' }).first();
    await expect(headerWithScheduled.locator('..')).toContainText('SCHEDULED:');

    // Re-open the header to verify the scheduled date persists
    await tablesHeader.click();
    await expect(actionDrawer).toBeVisible();
    await firefoxHelper.clickClickCatcherButton('drawer-action-scheduled');
    await expect(
      page.locator('.timestamp-editor__title:has-text("Edit scheduled timestamp")')
    ).toBeVisible();

    // Verify the date is still set to the 20th
    const dateInputVerify = page.locator('[data-testid="timestamp-selector"]');
    await expect(dateInputVerify).toHaveValue(newDate);
  });
});

test.describe('Header Properties', () => {
  let appHelper;
  let firefoxHelper;

  test.beforeEach(async ({ page }) => {
    appHelper = new AppHelper(page);
    firefoxHelper = new FirefoxHelper(page);

    await page.goto('/sample', { waitUntil: 'domcontentloaded' });
    await appHelper.waitForAppReady();
  });

  test('should edit header property value', async ({ page }) => {
    // Expand the "Property lists" section (level 1 header)
    const propertyListsHeader = page
      .locator('.header')
      .filter({ hasText: 'Property lists' })
      .first();
    await propertyListsHeader.scrollIntoViewIfNeeded();
    await propertyListsHeader.click();

    // Wait for header action drawer to appear and close it to expand the section
    await expect(page.locator('[data-testid="header-action-drawer"]')).toBeVisible();
    await page.getByText('Sample').click();
    await expect(page.locator('[data-testid="header-action-drawer"]')).toHaveCount(0, {
      timeout: 5000,
    });

    // Now click on the "Example" header (level 2 header under Property lists)
    const exampleHeader = page.locator('.header').filter({ hasText: 'Example' }).first();
    await exampleHeader.click();

    // Wait for the header action drawer to appear
    const actionDrawer = page.locator('[data-testid="header-action-drawer"]');
    await expect(actionDrawer).toBeVisible();

    // Click on the properties icon to open the property list editor
    await firefoxHelper.clickClickCatcherButton('drawer-action-properties');

    // Wait for the property list editor modal to open
    await expect(page.locator('[data-testid="property-list-editor-title"]')).toBeVisible();

    // Find the "callsign" property (index 0) and change its value from "Maverick" to "Goose"
    const propertyValueInput = page.locator(
      '[data-testid="property-list-editor-property-value-0"]'
    );
    await expect(propertyValueInput).toHaveValue('Maverick');
    await propertyValueInput.fill('Goose');

    // Close the drawer by switching to title editor mode (this saves the properties)
    await firefoxHelper.clickClickCatcherButton('drawer-action-edit-title');

    // Wait for the drawer to close by clicking outside (now that we're in a different mode)
    await page.locator('[data-testid="drawer-outer-container"]').first().click();

    // Wait for the drawer to close
    await expect(page.locator('[data-testid="drawer-outer-container"]')).not.toBeVisible({
      timeout: 5000,
    });

    // Re-open the header to verify the property value persists
    await exampleHeader.click();
    await expect(actionDrawer).toBeVisible();
    await firefoxHelper.clickClickCatcherButton('drawer-action-properties');
    await expect(page.locator('[data-testid="property-list-editor-title"]')).toBeVisible();

    // Verify the value is now "Goose"
    const propertyValueInputVerify = page.locator(
      '[data-testid="property-list-editor-property-value-0"]'
    );
    await expect(propertyValueInputVerify).toHaveValue('Goose');
  });
});

test.describe('Header Title', () => {
  let appHelper;
  let firefoxHelper;

  test.beforeEach(async ({ page }) => {
    appHelper = new AppHelper(page);
    firefoxHelper = new FirefoxHelper(page);

    await page.goto('/sample', { waitUntil: 'domcontentloaded' });
    await appHelper.waitForAppReady();
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
    await firefoxHelper.clickClickCatcherButton('drawer-action-edit-title');

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
    await firefoxHelper.clickClickCatcherButton('drawer-action-edit-title');
    await expect(page.locator('.drawer-modal__title:has-text("Edit title")')).toBeVisible();
    // Re-locate the title input as it's a new element
    const titleInputVerify = page.locator('[data-testid="titleLineInput"]');
    await expect(titleInputVerify).toHaveValue('Updated Tables Title');
  });
});

test.describe('Clocking', () => {
  let appHelper;
  let firefoxHelper;

  test.beforeEach(async ({ page }) => {
    appHelper = new AppHelper(page);
    firefoxHelper = new FirefoxHelper(page);

    await page.goto('/sample', { waitUntil: 'domcontentloaded' });
    await appHelper.waitForAppReady();
  });

  test('should clock in and out on a header', async ({ page }) => {
    // Use "Tables" header which we know exists from other tests
    const targetHeader = page.locator('.header').filter({ hasText: 'Tables' }).first();

    // Scroll into view and click on the header to select it
    await targetHeader.scrollIntoViewIfNeeded();
    await targetHeader.click();

    // Wait for the header action drawer to appear
    const actionDrawer = page.locator('[data-testid="header-action-drawer"]');
    await expect(actionDrawer).toBeVisible();

    // Verify the clock in button is visible (hourglass-start icon)
    const clockInButton = page.locator('[data-testid="org-clock-in"]');
    await expect(clockInButton).toBeVisible();

    // Verify the clock out button is not visible yet
    const clockOutButton = page.locator('[data-testid="org-clock-out"]');
    await expect(clockOutButton).toHaveCount(0);

    // Click the clock in button
    await firefoxHelper.clickClickCatcherButton('org-clock-in');

    // After clocking in, the clock in button should be gone and clock out should appear
    await expect(clockInButton).toHaveCount(0);
    await expect(clockOutButton).toBeVisible();

    // Close the drawer by switching to title editor mode (ensures clean state)
    await firefoxHelper.clickClickCatcherButton('drawer-action-edit-title');

    // Wait a moment for the state to settle
    await page.waitForTimeout(100);

    // Now click outside to close
    await page.locator('[data-testid="drawer-outer-container"]').first().click();

    // Wait for the drawer to close
    await expect(page.locator('[data-testid="drawer-outer-container"]')).not.toBeVisible();

    // Re-open the header to verify the clock is still running
    await targetHeader.click();
    await expect(actionDrawer).toBeVisible();
    await expect(clockOutButton).toBeVisible();

    // Click the clock out button
    await firefoxHelper.clickClickCatcherButton('org-clock-out');

    // After clocking out, the clock in button should be back and clock out should be gone
    await expect(clockInButton).toBeVisible();
    await expect(clockOutButton).toHaveCount(0);

    // Close the drawer by switching to title editor mode (ensures clean state)
    await firefoxHelper.clickClickCatcherButton('drawer-action-edit-title');

    // Wait a moment for the state to settle
    await page.waitForTimeout(100);

    // Now click outside to close
    await page.locator('[data-testid="drawer-outer-container"]').first().click();
    await expect(page.locator('[data-testid="drawer-outer-container"]')).not.toBeVisible();

    // Re-open to verify the clock state persisted (clocked out)
    await targetHeader.click();
    await expect(actionDrawer).toBeVisible();
    await expect(clockInButton).toBeVisible();
    await expect(clockOutButton).toHaveCount(0);
  });
});

test.describe('Header Creation', () => {
  let appHelper;
  let firefoxHelper;

  test.beforeEach(async ({ page }) => {
    appHelper = new AppHelper(page);
    firefoxHelper = new FirefoxHelper(page);

    await page.goto('/sample', { waitUntil: 'domcontentloaded' });
    await appHelper.waitForAppReady();
  });

  test('should add new header below current header', async ({ page }) => {
    const tablesHeader = page.locator('.header').filter({ hasText: 'Tables' }).first();

    // Scroll into view and click on the header to select it
    await tablesHeader.scrollIntoViewIfNeeded();
    await tablesHeader.click();

    // Wait for the header action drawer to appear
    const actionDrawer = page.locator('[data-testid="header-action-drawer"]');
    await expect(actionDrawer).toBeVisible();

    // Click the add new header button (plus icon)
    await firefoxHelper.clickClickCatcherButton('header-action-plus');

    // A new header should be created below the Tables header
    // The new header should be editable (title input should be visible)
    const titleInput = page.locator('[data-testid="titleLineInput"]');
    await expect(titleInput).toBeVisible();

    // Enter a title for the new header
    await titleInput.fill('New Test Header');

    // Save by pressing Enter
    await titleInput.press('Enter');

    // Wait for the drawer to close
    await expect(page.locator('[data-testid="drawer-outer-container"]')).not.toBeVisible();

    // Verify the new header appears below Tables
    const newHeader = page.locator('.header').filter({ hasText: 'New Test Header' });
    await expect(newHeader).toBeVisible();
  });
});
