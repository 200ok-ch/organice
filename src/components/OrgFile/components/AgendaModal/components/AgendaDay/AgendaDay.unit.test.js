import { parseOrg } from '../../../../../../lib/parse_org';

import AgendaDay from './index';

import { Map } from 'immutable';
import { parseISO } from 'date-fns';

import readFixture from '../../../../../../../test_helpers/index';

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
          path: '/testfile.org',
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
    const parsedOrgFile = parseOrg(testOrgFile);
    input.files = Map({ '/testfile.org': parsedOrgFile });

    expect(JSON.parse(JSON.stringify(component.getPlanningItemsAndHeaders(input)))).toEqual(output);
  });

  test('sorts habits before non-habits in agenda', () => {
    const input = {
      headers: [],
      todoKeywordSets: [],
      date: parseISO('2019-08-27T15:50:32.624Z'),
      agendaDefaultDeadlineDelayValue: 5,
      agendaDefaultDeadlineDelayUnit: 'd',
      dateStart: parseISO('2019-08-26T22:00:00.000Z'),
      dateEnd: parseISO('2019-08-27T21:59:59.999Z'),
      orgHabitShowAllToday: false,
    };
    const testOrgFile = readFixture('habit_and_nonhabit');
    const parsedOrgFile = parseOrg(testOrgFile);
    input.files = Map({ '/testfile.org': parsedOrgFile });

    const result = component.getPlanningItemsAndHeaders(input);

    // Should have 3 items (1 habit, 2 non-habits)
    expect(result.size).toBe(3);

    // First item should be the habit (Exercise Habit)
    expect(result.get(0)[1].getIn(['titleLine', 'rawTitle'])).toContain('Exercise Habit');

    // Items 1 and 2 should be non-habits (sorted by time, so Another Regular Task with time comes first)
    expect(result.get(1)[1].getIn(['titleLine', 'rawTitle'])).toContain('Another Regular Task');
    expect(result.get(2)[1].getIn(['titleLine', 'rawTitle'])).toContain('Regular Task');
  });
});
