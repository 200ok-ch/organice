import { generateTitleLine } from './export_org';
import { parseOrg } from './parse_org';

describe('generateTitleLine', () => {
  const header = (tags) => ({
    nestingLevel: 1,
    titleLine: { todoKeyword: null, rawTitle: 'Heading', tags },
  });

  test('omits the tag string when the only tag is empty', () => {
    expect(generateTitleLine(header(['']), true)).toEqual('* Heading');
  });

  test('skips empty tags next to real ones', () => {
    expect(generateTitleLine(header(['', 'tag']), true)).toMatch(/^\* Heading +:tag:$/);
  });

  test('a header with an empty tag round-trips without changing its title', () => {
    const exported = generateTitleLine(header(['']), true);
    const parsed = parseOrg(exported).toJS().headers[0].titleLine;
    expect(parsed.rawTitle.trim()).toEqual('Heading');
    expect(parsed.tags).toEqual([]);
  });
});
