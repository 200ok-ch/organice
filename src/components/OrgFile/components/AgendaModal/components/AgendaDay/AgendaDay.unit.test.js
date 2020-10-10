import { parseOrg } from '../../../../../../lib/parse_org';

import AgendaDay from './index';

import { parseISO } from 'date-fns';

import readFixture from '../../../../../../../test_helpers/index';

function parseOrgFile(testOrgFile) {
  const parsedFile = parseOrg(testOrgFile);
  const headers = parsedFile.get('headers');
  const todoKeywordSets = parsedFile.get('todoKeywordSets');
  return { headers, todoKeywordSets };
}

describe('Unit Tests for AgendaDay', () => {
  const component = new AgendaDay();
  test('Given some headlines, it constructs a datastructure for the relevant ones for the "today" view', () => {
    let input = {
      headers: [],
      todoKeywordSets: [],
      date: parseISO('2019-08-27T15:50:32.624Z'),
      agendaDefaultDeadlineDelayValue: 5,
      agendaDefaultDeadlineDelayUnit: 'd',
      dateStart: parseISO('2019-08-26T22:00:00.000Z'),
      dateEnd: parseISO('2019-08-27T21:59:59.999Z'),
    };
    // INFO: The output here is stringified output from the algorithm,
    // taken from a manually verified run of `AgendaDay` in the
    // application. It's not necessarily meant to manually update it
    // in the future, instead insert new valid data from the web app
    // itself.
    const output = [
      [
        {
          type: 'DEADLINE',
          timestamp: { month: '08', dayName: 'Tue', isActive: true, day: '27', year: '2019' },
          id: 7,
        },
        {
          titleLine: {
            title: [{ type: 'text', contents: 'This is a deadline header' }],
            rawTitle: 'This is a deadline header',
            todoKeyword: 'START',
            tags: [],
          },
          rawDescription: '\n',
          description: [{ type: 'text', contents: '\n' }],
          opened: false,
          id: 4,
          logNotes: [],
          nestingLevel: 1,
          logBookEntries: [],
          planningItems: [
            {
              type: 'DEADLINE',
              timestamp: { month: '08', dayName: 'Tue', isActive: true, day: '27', year: '2019' },
              id: 7,
            },
          ],
          propertyListItems: [],
          totalTimeLogged: 0,
          totalTimeLoggedRecursive: 0,
        },
      ],
    ];
    const testOrgFile = readFixture('multiple_headlines_with_timestamps_simple');
    const parsedOrgFile = parseOrgFile(testOrgFile);
    input.headers = parsedOrgFile.headers;
    input.todoKeywordSets = parsedOrgFile.todoKeywordSets;

    expect(JSON.parse(JSON.stringify(component.getPlanningItemsAndHeaders(input)))).toEqual(output);
  });
});
