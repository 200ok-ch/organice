import { fromJS } from 'immutable';
import { parseCaptureTemplate } from './capture_template_parsing';

// Default TODO keyword sets for testing
const defaultTodoKeywordSets = fromJS([
  {
    keywords: ['TODO', 'DONE'],
    completedKeywords: ['DONE'],
    default: true,
  },
]);

describe('parseCaptureTemplate', () => {
  describe('basic template parsing', () => {
    test('parses simple template with TODO and cursor in title', () => {
      const result = parseCaptureTemplate('* TODO %?', defaultTodoKeywordSets);

      // When template is '* TODO %?', after substitution it becomes '* TODO '
      // newHeaderFromText strips to 'TODO' which doesn't match 'TODO ' pattern
      // so it's treated as title text, not a keyword
      expect(result.header.getIn(['titleLine', 'rawTitle'])).toBe('TODO');
      expect(result.header.get('description').size).toBe(0);
      expect(result.initialSubEditor).toBe('title-editor');
      expect(result.substitutedText).toBe('* TODO ');
    });

    test('parses template with title text', () => {
      const result = parseCaptureTemplate('* TODO meeting notes', defaultTodoKeywordSets);

      expect(result.header.getIn(['titleLine', 'todoKeyword'])).toBe('TODO');
      expect(result.header.getIn(['titleLine', 'rawTitle'])).toBe('meeting notes');
      expect(result.initialSubEditor).toBe('title-editor'); // No cursor, defaults to title
    });

    test('handles empty template', () => {
      const result = parseCaptureTemplate('', defaultTodoKeywordSets);

      expect(result.header.getIn(['titleLine', 'rawTitle'])).toBe('');
      expect(result.initialSubEditor).toBe('title-editor');
      expect(result.substitutedText).toBe('');
    });

    test('handles whitespace-only template', () => {
      const result = parseCaptureTemplate('   \n  ', defaultTodoKeywordSets);

      expect(result.header.getIn(['titleLine', 'rawTitle'])).toBe('');
      expect(result.initialSubEditor).toBe('title-editor');
    });
  });

  describe('template variable substitution', () => {
    test('substitutes timestamp variables', () => {
      const template = '* TODO meeting %T';
      const result = parseCaptureTemplate(template, defaultTodoKeywordSets);

      // Should contain a timestamp in the title
      const rawTitle = result.header.getIn(['titleLine', 'rawTitle']);
      expect(rawTitle).toContain('meeting <');
      expect(rawTitle).toMatch(/\d{4}-\d{2}-\d{2}/); // Contains date
    });

    test('substitutes custom variables', () => {
      const template = '* TODO %custom_var';
      const customVariables = fromJS({ custom_var: 'my custom value' });
      const result = parseCaptureTemplate(template, defaultTodoKeywordSets, customVariables);

      expect(result.header.getIn(['titleLine', 'rawTitle'])).toContain('my custom value');
    });
  });

  describe('cursor position and sub-editor selection', () => {
    test('cursor in title line selects title-editor', () => {
      const result = parseCaptureTemplate('* TODO %?', defaultTodoKeywordSets);
      expect(result.initialSubEditor).toBe('title-editor');
    });

    test('cursor in description selects description-editor', () => {
      const result = parseCaptureTemplate('* TODO task\n%?', defaultTodoKeywordSets);
      expect(result.initialSubEditor).toBe('description-editor');
    });

    test('cursor in description after blank line selects description-editor', () => {
      const result = parseCaptureTemplate('* TODO task\n\n%?\nSome text', defaultTodoKeywordSets);
      expect(result.initialSubEditor).toBe('description-editor');
    });

    test('no cursor defaults to title-editor', () => {
      const result = parseCaptureTemplate('* TODO task', defaultTodoKeywordSets);
      expect(result.initialSubEditor).toBe('title-editor');
    });

    test('cursor in properties drawer selects property-list-editor', () => {
      const template = '* TODO task\n:PROPERTIES:\n:CATEGORY: %?\n:END:';
      const result = parseCaptureTemplate(template, defaultTodoKeywordSets);

      expect(result.initialSubEditor).toBe('property-list-editor');
      expect(result.header.get('propertyListItems').size).toBeGreaterThan(0);
    });

    test('cursor on SCHEDULED line selects scheduled-editor', () => {
      const template = '* TODO task\nSCHEDULED: %?';
      const result = parseCaptureTemplate(template, defaultTodoKeywordSets);

      expect(result.initialSubEditor).toBe('scheduled-editor');
    });

    test('cursor on DEADLINE line selects deadline-editor', () => {
      const template = '* TODO task\nDEADLINE: %?';
      const result = parseCaptureTemplate(template, defaultTodoKeywordSets);

      expect(result.initialSubEditor).toBe('deadline-editor');
    });

    test('cursor after properties drawer selects description-editor', () => {
      const template = '* TODO task\n:PROPERTIES:\n:CATEGORY: work\n:END:\n%?';
      const result = parseCaptureTemplate(template, defaultTodoKeywordSets);

      expect(result.initialSubEditor).toBe('description-editor');
    });
  });

  describe('structured field parsing', () => {
    test('parses tags from title line', () => {
      const result = parseCaptureTemplate('* TODO task :work:urgent:', defaultTodoKeywordSets);

      const tags = result.header.getIn(['titleLine', 'tags']);
      expect(tags.toJS()).toEqual(['work', 'urgent']);
    });

    test('parses properties drawer', () => {
      const template = '* TODO task\n:PROPERTIES:\n:CATEGORY: work\n:ID: 123\n:END:';
      const result = parseCaptureTemplate(template, defaultTodoKeywordSets);

      const properties = result.header.get('propertyListItems');
      expect(properties.size).toBe(2);

      // Check that properties were parsed (exact structure may vary)
      const propertyNames = properties.map((p) => p.get('property')).toJS();
      expect(propertyNames).toContain('CATEGORY');
      expect(propertyNames).toContain('ID');
    });

    test('parses SCHEDULED planning item', () => {
      const template = '* TODO task\nSCHEDULED: <2026-02-10 Mon>';
      const result = parseCaptureTemplate(template, defaultTodoKeywordSets);

      const planningItems = result.header.get('planningItems');
      expect(planningItems.size).toBeGreaterThan(0);

      const scheduledItem = planningItems.find((item) => item.get('type') === 'SCHEDULED');
      expect(scheduledItem).toBeDefined();
    });

    test('parses DEADLINE planning item', () => {
      const template = '* TODO task\nDEADLINE: <2026-02-15 Sat>';
      const result = parseCaptureTemplate(template, defaultTodoKeywordSets);

      const planningItems = result.header.get('planningItems');
      expect(planningItems.size).toBeGreaterThan(0);

      const deadlineItem = planningItems.find((item) => item.get('type') === 'DEADLINE');
      expect(deadlineItem).toBeDefined();
    });

    test('parses description text', () => {
      const template = '* TODO task\nThis is a description\nWith multiple lines';
      const result = parseCaptureTemplate(template, defaultTodoKeywordSets);

      const description = result.header.get('description');
      expect(description.size).toBeGreaterThan(0);

      // Description should contain the text (exact structure depends on parser)
      const rawDescription = result.header.get('rawDescription');
      expect(rawDescription).toContain('This is a description');
      expect(rawDescription).toContain('With multiple lines');
    });

    test('parses complex template with all elements', () => {
      const template = `* TODO complex task :work:urgent:
:PROPERTIES:
:CATEGORY: project
:EFFORT: 2h
:END:
SCHEDULED: <2026-02-10 Mon>
DEADLINE: <2026-02-15 Sat>
This is the description
With multiple lines`;

      const result = parseCaptureTemplate(template, defaultTodoKeywordSets);

      // Verify all parts were parsed
      expect(result.header.getIn(['titleLine', 'todoKeyword'])).toBe('TODO');
      expect(result.header.getIn(['titleLine', 'tags']).toJS()).toEqual(['work', 'urgent']);
      expect(result.header.get('propertyListItems').size).toBe(2);
      expect(result.header.get('planningItems').size).toBeGreaterThan(0);
      expect(result.header.get('rawDescription')).toContain('This is the description');
    });
  });

  describe('edge cases', () => {
    test('handles template with only title (no description)', () => {
      const result = parseCaptureTemplate('* TODO simple task', defaultTodoKeywordSets);

      expect(result.header.getIn(['titleLine', 'todoKeyword'])).toBe('TODO');
      expect(result.header.getIn(['titleLine', 'rawTitle'])).toBe('simple task');
      expect(result.header.get('description').size).toBe(0);
    });

    test('handles template without TODO keyword', () => {
      const result = parseCaptureTemplate('* Just a header', defaultTodoKeywordSets);

      expect(result.header.getIn(['titleLine', 'todoKeyword'])).toBeUndefined();
      expect(result.header.getIn(['titleLine', 'rawTitle'])).toBe('Just a header');
    });

    test('handles template with only properties drawer', () => {
      const template = '* task\n:PROPERTIES:\n:CATEGORY: test\n:END:';
      const result = parseCaptureTemplate(template, defaultTodoKeywordSets);

      expect(result.header.get('propertyListItems').size).toBe(1);
      expect(result.header.get('description').size).toBe(0);
    });

    test('handles template with asterisks in title', () => {
      const result = parseCaptureTemplate('* TODO task ***', defaultTodoKeywordSets);

      const rawTitle = result.header.getIn(['titleLine', 'rawTitle']);
      expect(rawTitle).toContain('task');
    });

    test('handles multiline description without planning items', () => {
      const template = '* TODO task\nLine 1\nLine 2\nLine 3';
      const result = parseCaptureTemplate(template, defaultTodoKeywordSets);

      const rawDescription = result.header.get('rawDescription');
      expect(rawDescription).toContain('Line 1');
      expect(rawDescription).toContain('Line 2');
      expect(rawDescription).toContain('Line 3');
    });
  });

  describe('todoKeywordSets variations', () => {
    test('handles custom TODO keywords', () => {
      const customKeywordSets = fromJS([
        {
          keywords: ['NEXT', 'WAITING', 'DONE'],
          completedKeywords: ['DONE'],
          default: true,
        },
      ]);

      const result = parseCaptureTemplate('* NEXT task', customKeywordSets);

      expect(result.header.getIn(['titleLine', 'todoKeyword'])).toBe('NEXT');
    });

    test('handles multiple keyword sets', () => {
      const multipleKeywordSets = fromJS([
        {
          keywords: ['TODO', 'DONE'],
          completedKeywords: ['DONE'],
          default: true,
        },
        {
          keywords: ['NEXT', 'WAITING', 'FINISHED'],
          completedKeywords: ['FINISHED'],
          default: false,
        },
      ]);

      const result = parseCaptureTemplate('* WAITING task', multipleKeywordSets);

      expect(result.header.getIn(['titleLine', 'todoKeyword'])).toBe('WAITING');
    });
  });
});
