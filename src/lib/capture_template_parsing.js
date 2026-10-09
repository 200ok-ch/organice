import { Map } from 'immutable';

import substituteTemplateVariables from './capture_template_substitution';
import { newHeaderFromText } from './parse_org';

/**
 * Determines which sub-editor should receive initial focus based on cursor position (%?) in template.
 *
 * @param {string} substitutedText - The template text after variable substitution (with %? removed)
 * @param {number|null} cursorIndex - Index where %? was located, or null if no %?
 * @returns {string} One of: 'title-editor', 'description-editor', 'property-list-editor', 'scheduled-editor', 'deadline-editor'
 */
const determineInitialSubEditor = (substitutedText, cursorIndex) => {
  // Default to title editor if no cursor marker
  if (cursorIndex === null) {
    return 'title-editor';
  }

  // Find which line the cursor is on
  const textBeforeCursor = substitutedText.substring(0, cursorIndex);
  const lineNumber = (textBeforeCursor.match(/\n/g) || []).length;

  // Line 0 is the title line
  if (lineNumber === 0) {
    return 'title-editor';
  }

  // Get all lines to analyze context
  const lines = substitutedText.split('\n');

  // Check if cursor is within properties drawer
  let inPropertiesDrawer = false;
  for (let i = 0; i <= lineNumber && i < lines.length; i++) {
    const line = lines[i].trim();
    if (line === ':PROPERTIES:') {
      inPropertiesDrawer = true;
    } else if (line === ':END:' && inPropertiesDrawer) {
      // If we've passed :END:, we're no longer in properties
      if (i < lineNumber) {
        inPropertiesDrawer = false;
      }
    }
  }

  if (inPropertiesDrawer) {
    return 'property-list-editor';
  }

  // Check if cursor is on a line with SCHEDULED: or DEADLINE:
  const currentLine = lines[lineNumber];
  if (currentLine && currentLine.trim().startsWith('SCHEDULED:')) {
    return 'scheduled-editor';
  }
  if (currentLine && currentLine.trim().startsWith('DEADLINE:')) {
    return 'deadline-editor';
  }

  // Otherwise, cursor is in description
  return 'description-editor';
};

/**
 * Parses a capture template string into a structured header suitable for the unified editor.
 *
 * This is the core parsing logic for capture templates:
 * 1. Substitutes template variables (%t, %T, %u, %U, custom variables)
 * 2. Parses the result into structured header fields (title, TODO, tags, properties, planning items, description)
 * 3. Determines which sub-editor should receive initial focus based on %? position
 *
 * @param {string} templateString - The raw template string (e.g., "* TODO %?\n:PROPERTIES:\n:CATEGORY: work\n:END:")
 * @param {Immutable.List} todoKeywordSets - List of TODO keyword sets for parsing (from Redux state)
 * @param {Immutable.Map} customVariables - Custom template variables (default: empty Map)
 * @returns {Object} { header: Immutable.Map, initialSubEditor: string, substitutedText: string }
 */
export const parseCaptureTemplate = (templateString, todoKeywordSets, customVariables = Map()) => {
  // Handle empty template
  if (!templateString || templateString.trim() === '') {
    const emptyHeader = newHeaderFromText('', todoKeywordSets);
    return {
      header: emptyHeader,
      initialSubEditor: 'title-editor',
      substitutedText: '',
    };
  }

  // Step 1: Substitute template variables
  const [substitutedText, cursorIndex] = substituteTemplateVariables(
    templateString,
    customVariables
  );

  // Step 2: Parse into structured header
  const header = newHeaderFromText(substitutedText, todoKeywordSets);

  // Step 3: Determine which sub-editor should receive focus
  const initialSubEditor = determineInitialSubEditor(substitutedText, cursorIndex);

  return {
    header,
    initialSubEditor,
    substitutedText,
  };
};
