import { test, expect } from '../../fixtures.js';

test.describe('Header Tags', () => {
  const tagsEditorTitle = (page) => page.getByTestId('tags-editor-modal-title');
  const tagButton = (page, tag) => page.getByTestId(`tags-editor-tag-${tag}`);

  test('should add a tag to a header', async ({ page, sample }) => {
    const tablesHeader = await sample.select('Tables');
    await sample.action('drawer-action-tags');
    await expect(tagsEditorTitle(page)).toBeVisible();

    // 'cute' is an existing tag from the Dogs section of sample.org.
    await tagButton(page, 'cute').click();
    await expect(tagButton(page, 'cute')).toHaveAttribute('data-in-use', 'true');

    await sample.closeDrawer();
    await expect(tablesHeader.locator('.header-tag')).toHaveText(['cute']);

    // Re-open the tags editor to verify the tag was saved
    await tablesHeader.click();
    await sample.action('drawer-action-tags');
    await expect(tagButton(page, 'cute')).toHaveAttribute('data-in-use', 'true');
  });

  test('should remove a tag from a header', async ({ page, sample }) => {
    await sample.expand('Actions', 'Tags', 'Dogs');

    const eloiseHeader = await sample.select('Eloise');
    await expect(eloiseHeader.locator('.header-tag')).toHaveText([
      'cute',
      'middleaged',
      'tiny',
      'dog',
    ]);
    await sample.action('drawer-action-tags');
    await expect(tagsEditorTitle(page)).toBeVisible();

    await expect(tagButton(page, 'tiny')).toHaveAttribute('data-in-use', 'true');
    await tagButton(page, 'tiny').click();
    await expect(tagButton(page, 'tiny')).toHaveAttribute('data-in-use', 'false');

    await sample.closeDrawer();
    await expect(eloiseHeader.locator('.header-tag')).toHaveText(['cute', 'middleaged', 'dog']);

    // Re-open the tags editor to verify the removal persisted
    await eloiseHeader.click();
    await sample.action('drawer-action-tags');
    await expect(tagButton(page, 'tiny')).toHaveAttribute('data-in-use', 'false');
  });

  test('should add multiple tags to a header', async ({ page, sample }) => {
    const tablesHeader = await sample.select('Tables');
    await sample.action('drawer-action-tags');
    await expect(tagsEditorTitle(page)).toBeVisible();

    await tagButton(page, 'cute').click();
    await tagButton(page, 'old').click();
    await expect(tagButton(page, 'cute')).toHaveAttribute('data-in-use', 'true');
    await expect(tagButton(page, 'old')).toHaveAttribute('data-in-use', 'true');

    await sample.closeDrawer();
    await expect(tablesHeader.locator('.header-tag')).toHaveText(['cute', 'old']);
  });
});

test.describe('Header Description', () => {
  test('should edit header description', async ({ page, sample }) => {
    const tapHeader = await sample.select('Tap on any header to open it');
    await sample.action('edit-header-title');
    await expect(page.locator('.drawer-modal__title:has-text("Edit description")')).toBeVisible();

    const newDescription = 'This is an updated description for testing purposes.';
    await page.getByTestId('description-textarea').fill(newDescription);
    await sample.closeDrawer({ commit: false });

    await expect(tapHeader.locator('..')).toContainText(newDescription);

    // Re-open the description editor to verify the description persists
    await tapHeader.click();
    await sample.action('edit-header-title');
    // The textarea value includes a trailing newline from the editor
    expect((await page.getByTestId('description-textarea').inputValue()).trim()).toBe(
      newDescription
    );
  });
});

test.describe('Description List Auto-Continuation', () => {
  const cases = [
    ['continues an unordered list', '- item one', 1, '- item one\n- '],
    ['continues a checkbox list', '- [ ] item one', 1, '- [ ] item one\n- [ ] '],
    ['continues an ordered list', '1. first item', 1, '1. first item\n2. '],
    ['exits an unordered list on an empty item', '- item one', 2, '- item one\n'],
    ['exits an ordered list on an empty item', '1. first item', 2, '1. first item\n'],
  ];

  for (const [name, line, enterPresses, expected] of cases) {
    test(name, async ({ page, sample }) => {
      await sample.select('Tables');
      await sample.action('edit-header-title');
      const textarea = page.getByTestId('description-textarea');
      await expect(textarea).toBeVisible();

      await textarea.fill('');
      await textarea.pressSequentially(line);
      for (let i = 0; i < enterPresses; i++) {
        await textarea.press('Enter');
      }

      await expect(textarea).toHaveValue(expected);
    });
  }
});

test.describe('Planning Items (Timestamps)', () => {
  const planningTypes = [
    { keyword: 'DEADLINE', action: 'drawer-action-deadline', title: 'Edit deadline', day: '15' },
    {
      keyword: 'SCHEDULED',
      action: 'drawer-action-scheduled',
      title: 'Edit scheduled timestamp',
      day: '20',
    },
  ];

  for (const { keyword, action, title, day } of planningTypes) {
    test(`should set and clear a ${keyword} timestamp`, async ({ page, sample }) => {
      const editorTitle = page.locator(`.timestamp-editor__title:has-text("${title}")`);
      const dateInput = page.getByTestId('timestamp-selector');

      const tablesHeader = await sample.select('Tables');
      const headerContainer = tablesHeader.locator('..');
      await sample.action(action);
      await expect(editorTitle).toBeVisible();

      await page.locator('.timestamp-editor__icon--add').first().click();
      const [year, month] = (await dateInput.inputValue()).split('-');
      const newDate = `${year}-${month}-${day}`;
      await dateInput.fill(newDate);
      await sample.closeDrawer();

      await expect(headerContainer).toContainText(`${keyword}:`);

      // Re-open the editor to verify the date persists
      await tablesHeader.click();
      await sample.action(action);
      await expect(editorTitle).toBeVisible();
      await expect(dateInput).toHaveValue(newDate);

      // An empty date removes the planning item entirely
      await dateInput.fill('');
      await sample.closeDrawer();

      await expect(headerContainer).not.toContainText(`${keyword}:`);
    });
  }
});

test.describe('Header Properties', () => {
  test('should edit header property value', async ({ page, sample }) => {
    await sample.expand('Property lists');

    const exampleHeader = await sample.select('Example');
    await sample.action('drawer-action-properties');
    await expect(page.getByTestId('property-list-editor-title')).toBeVisible();

    const callsign = page.getByTestId('property-list-editor-property-value-0');
    await expect(callsign).toHaveValue('Maverick');
    await callsign.fill('Goose');
    await sample.closeDrawer();

    // Re-open the property editor to verify the value persists
    await exampleHeader.click();
    await sample.action('drawer-action-properties');
    await expect(page.getByTestId('property-list-editor-property-value-0')).toHaveValue('Goose');
  });
});

test.describe('Header Title', () => {
  test('should edit header title', async ({ page, sample }) => {
    await sample.select('Tables');
    await sample.action('drawer-action-edit-title');
    await expect(page.locator('.drawer-modal__title:has-text("Edit title")')).toBeVisible();

    const titleInput = page.getByTestId('titleLineInput');
    await titleInput.fill('Updated Tables Title');
    // The title editor saves on newline
    await titleInput.press('Enter');
    await expect(sample.drawer).toHaveCount(0);

    const updatedHeader = sample.header('Updated Tables Title');
    await expect(updatedHeader).toBeVisible();

    // Re-open the title editor to verify the title persists
    await updatedHeader.click();
    await sample.action('drawer-action-edit-title');
    await expect(page.getByTestId('titleLineInput')).toHaveValue('Updated Tables Title');
  });
});

test.describe('Clocking', () => {
  test('should clock in and out on a header', async ({ page, sample }) => {
    const clockInButton = page.getByTestId('org-clock-in');
    const clockOutButton = page.getByTestId('org-clock-out');

    const tablesHeader = await sample.select('Tables');
    await expect(clockInButton).toBeVisible();
    await expect(clockOutButton).toHaveCount(0);

    await sample.action('org-clock-in');
    await expect(clockInButton).toHaveCount(0);
    await expect(clockOutButton).toBeVisible();

    // Close and re-select to verify the clock is still running
    await sample.closeDrawer();
    await tablesHeader.click();
    await expect(clockOutButton).toBeVisible();

    await sample.action('org-clock-out');
    await expect(clockInButton).toBeVisible();
    await expect(clockOutButton).toHaveCount(0);

    await sample.closeDrawer();
    await tablesHeader.click();
    await expect(clockInButton).toBeVisible();
    await expect(clockOutButton).toHaveCount(0);
  });
});

test.describe('Header Creation', () => {
  test('should add new header below current header', async ({ page, sample }) => {
    await sample.select('Tables');
    await sample.action('header-action-plus');

    const titleInput = page.getByTestId('titleLineInput');
    await expect(titleInput).toBeVisible();
    await titleInput.fill('New Test Header');
    await titleInput.press('Enter');
    await expect(sample.drawer).toHaveCount(0);

    // The new header is a sibling inserted after the Tables subtree
    const titles = await sample.titles();
    const tablesIndex = titles.indexOf('Tables');
    expect(tablesIndex).toBeGreaterThan(-1);
    expect(titles.slice(tablesIndex + 1, tablesIndex + 3)).toEqual([
      'Table actions',
      'New Test Header',
    ]);
  });
});
