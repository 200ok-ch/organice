import { fromJS } from 'immutable';
import {
  isHabit,
  parseHabitRepeat,
  getHabitHistory,
  calculateHabitConsistency,
  HABIT_DEFAULTS,
} from './org_utils';

describe('Org Habit Utilities', () => {
  describe('isHabit', () => {
    test('returns true for header with STYLE: habit property', () => {
      const header = fromJS({
        propertyListItems: [{ property: 'STYLE', value: [{ type: 'text', contents: 'habit' }] }],
      });
      expect(isHabit(header)).toBe(true);
    });

    test('returns false for header without STYLE property', () => {
      const header = fromJS({
        propertyListItems: [{ property: 'OTHER', value: [{ type: 'text', contents: 'value' }] }],
      });
      expect(isHabit(header)).toBe(false);
    });

    test('returns false for header with STYLE property but not habit', () => {
      const header = fromJS({
        propertyListItems: [{ property: 'STYLE', value: [{ type: 'text', contents: 'other' }] }],
      });
      expect(isHabit(header)).toBe(false);
    });
  });

  describe('parseHabitRepeat', () => {
    test('parses simple habit repeater', () => {
      const timestamp = fromJS({
        repeaterType: '.+',
        repeaterUnit: 'd',
        repeaterValue: 2,
      });
      expect(parseHabitRepeat(timestamp)).toEqual({ minDays: 2, maxDays: 2 });
    });

    test('parses range habit repeater', () => {
      const timestamp = fromJS({
        repeaterType: '.+',
        repeaterUnit: 'd',
        repeaterValue: 4,
        repeaterDeadlineValue: 2,
      });
      expect(parseHabitRepeat(timestamp)).toEqual({ minDays: 2, maxDays: 4 });
    });

    test('parses weekly habit repeater (converting to days)', () => {
      const timestamp = fromJS({
        repeaterType: '++',
        repeaterUnit: 'w',
        repeaterValue: 1,
        repeaterDeadlineValue: 2,
        repeaterDeadlineUnit: 'w',
      });
      // 1 week = 7 days, 2 weeks = 14 days
      expect(parseHabitRepeat(timestamp)).toEqual({ minDays: 14, maxDays: 7 });
    });

    test('returns null for invalid repeater unit', () => {
      const timestamp = fromJS({
        repeaterType: '.+',
        repeaterUnit: 'h', // hours not supported for habits
        repeaterValue: 1,
      });
      expect(parseHabitRepeat(timestamp)).toBeNull();
    });
  });

  describe('getHabitHistory', () => {
    test('extracts completion dates from log notes', () => {
      const header = fromJS({
        logNotes: [
          {
            type: 'list',
            items: [
              {
                titleLine: [
                  { type: 'text', contents: '- State "DONE" from "TODO" [2024-01-01 Mon 10:00]' },
                ],
              },
              {
                titleLine: [
                  { type: 'text', contents: '- State "DONE" from "TODO" [2024-01-02 Tue]' },
                ],
              },
            ],
          },
        ],
      });

      const history = getHabitHistory(header);
      expect(history).toHaveLength(2);
      expect(history[0].getFullYear()).toBe(2024);
      expect(history[0].getMonth()).toBe(0); // Jan
      expect(history[0].getDate()).toBe(1);
      expect(history[1].getDate()).toBe(2);
    });

    test('extracts completion dates from plain text log notes', () => {
      const header = fromJS({
        logNotes: [{ type: 'text', contents: '- State "DONE" from "TODO" [2024-01-03 Wed]' }],
      });

      const history = getHabitHistory(header);
      expect(history).toHaveLength(1);
      expect(history[0].getDate()).toBe(3);
    });

    test('extracts completion dates from logBookEntries', () => {
      const header = fromJS({
        logBookEntries: [
          { raw: '- State "DONE" from "TODO" [2024-01-04 Thu]' },
          { raw: 'CLOCK: [2024-01-05 Fri 10:00]--[2024-01-05 Fri 11:00] =>  1:00' }, // Should be ignored
        ],
      });

      const history = getHabitHistory(header);
      expect(history).toHaveLength(1);
      expect(history[0].getDate()).toBe(4);
    });
  });

  describe('calculateHabitConsistency', () => {
    test('returns correct sequence for a simple completed habit', () => {
      const today = new Date(2024, 0, 10); // Jan 10 2024
      const header = fromJS({
        propertyListItems: [{ property: 'STYLE', value: [{ type: 'text', contents: 'habit' }] }],
        planningItems: [
          {
            type: 'SCHEDULED',
            timestamp: {
              repeaterType: '.+',
              repeaterUnit: 'd',
              repeaterValue: 1,
              year: 2024,
              month: 1,
              day: 1,
            },
          },
        ],
        logNotes: [
          {
            type: 'list',
            items: [
              {
                titleLine: [
                  { type: 'text', contents: '- State "DONE" from "TODO" [2024-01-09 Tue]' },
                ],
              },
              {
                titleLine: [
                  { type: 'text', contents: '- State "DONE" from "TODO" [2024-01-08 Mon]' },
                ],
              },
            ],
          },
        ],
      });

      // Preceding 2 days, Following 1 day
      const graph = calculateHabitConsistency(header, today, {
        precedingDays: 2,
        followingDays: 1,
      });

      // Dates: Jan 8 (Done), Jan 9 (Done), Jan 10 (Today - Scheduled), Jan 11 (Scheduled)

      expect(graph).toHaveLength(4);

      // Jan 8 - Done
      expect(graph[0].status).toBe('done');
      expect(graph[0].date.getDate()).toBe(8);

      // Jan 9 - Done
      expect(graph[1].status).toBe('done');

      // Jan 10 - Today - Due soon (yellow, since it's the expected deadline)
      expect(graph[2].date.getDate()).toBe(10);
      // Last done was Jan 9, maxDays=1. Due date = Jan 10.
      // Today is Jan 10 (equals expectedDate), and it's not done yet.
      // This should be 'due-soon' (yellow) since we're at the deadline today.
      expect(graph[2].status).toBe('due-soon');

      // Jan 11 - Overdue (past deadline of Jan 10)
      expect(graph[3].date.getDate()).toBe(11);
      expect(graph[3].status).toBe('overdue');
    });

    test('returns correct status for habit due today with no completions', () => {
      const today = new Date(2026, 0, 6); // Jan 6 2026
      const header = fromJS({
        propertyListItems: [{ property: 'STYLE', value: [{ type: 'text', contents: 'habit' }] }],
        planningItems: [
          {
            type: 'SCHEDULED',
            timestamp: {
              repeaterType: '.+',
              repeaterUnit: 'd',
              repeaterValue: 1,
              year: 2026,
              month: 1,
              day: 6,
            },
          },
        ],
        logNotes: [], // No completion history
      });

      const graph = calculateHabitConsistency(header, today, {
        precedingDays: 1,
        followingDays: 1,
      });

      // Jan 5 - Before scheduled date
      expect(graph[0].date.getDate()).toBe(5);
      expect(graph[0].status).toBe('not-scheduled');

      // Jan 6 - Today, at deadline, should be due-soon (yellow)
      expect(graph[1].date.getDate()).toBe(6);
      expect(graph[1].status).toBe('due-soon');

      // Jan 7 - Tomorrow, past deadline, should be overdue (red)
      expect(graph[2].date.getDate()).toBe(7);
      expect(graph[2].status).toBe('overdue');
    });

    test('reproduces blue today issue (string concatenation bug regression)', () => {
      // Mock header with:
      // SCHEDULED: <2026-01-07 Wed .+1d>
      // :LAST_REPEAT: [2026-01-06 Tue 11:09]
      // :LOGBOOK: ...
      const header = fromJS({
        propertyListItems: [{ property: 'STYLE', value: [{ type: 'text', contents: 'habit' }] }],
        planningItems: [
          {
            type: 'SCHEDULED',
            timestamp: {
              repeaterType: '.+',
              repeaterUnit: 'd',
              repeaterValue: '1', // String value to test parsing safety
              // parsed dates needed for dateForTimestamp
              year: 2026,
              month: 1,
              day: 7,
            },
          },
        ],
        logBookEntries: [{ raw: '- State "DONE"       from "TODO"       [2026-01-06 Tue 11:09]' }],
      });

      // Today is 2026-01-07
      // Let's pick a time early in the day, e.g., 09:00
      const today = new Date('2026-01-07T09:00:00');

      const result = calculateHabitConsistency(header, today, {
        precedingDays: 1,
        followingDays: 1,
      });

      // Find the entry for today
      const todayEntry = result.find(
        (d) => d.date.getDate() === 7 && d.date.getMonth() === 0 && d.date.getFullYear() === 2026
      );

      // Expect status to be 'due-soon' (Yellow) or 'scheduled'
      // This assertion fails if it returns 'future' (Blue)
      expect(todayEntry.status).not.toBe('future');
      expect(['due-soon', 'scheduled']).toContain(todayEntry.status);
    });

    test('future days past deadline should be overdue (red)', () => {
      // Mock header with:
      // SCHEDULED: <2026-01-07 Wed .+1d>
      // Done on 2026-01-07
      const header = fromJS({
        propertyListItems: [{ property: 'STYLE', value: [{ type: 'text', contents: 'habit' }] }],
        planningItems: [
          {
            type: 'SCHEDULED',
            timestamp: {
              repeaterType: '.+',
              repeaterUnit: 'd',
              repeaterValue: '1',
              year: 2026,
              month: 1,
              day: 7,
            },
          },
        ],
        logBookEntries: [{ raw: '- State "DONE"       from "TODO"       [2026-01-07 Wed 09:00]' }],
      });

      // Today is 2026-01-07
      const today = new Date('2026-01-07T12:00:00');

      // We want to see:
      // Jan 7 (Today): Done (Green)
      // Jan 8 (Tomorrow): Due Soon (Yellow) - because deadline is Jan 8
      // Jan 9 (Future): Overdue (Red) - because it's past deadline (Jan 8)

      const result = calculateHabitConsistency(header, today, {
        precedingDays: 0,
        followingDays: 2,
      });

      const jan7 = result.find((d) => d.date.getDate() === 7);
      const jan8 = result.find((d) => d.date.getDate() === 8);
      const jan9 = result.find((d) => d.date.getDate() === 9);

      expect(jan7.status).toBe('done');
      expect(jan8.status).toBe('due-soon');
      expect(jan9.status).toBe('overdue');
    });

    test('supports GTD Weekly Review with ++1w/2w repeater', () => {
      // Header data:
      // * TODO GTD Weekly Review
      // SCHEDULED: <2026-01-06 Tue ++1w/2w>
      const header = fromJS({
        propertyListItems: [{ property: 'STYLE', value: [{ type: 'text', contents: 'habit' }] }],
        planningItems: [
          {
            type: 'SCHEDULED',
            timestamp: {
              repeaterType: '++',
              repeaterUnit: 'w',
              repeaterValue: '1',
              repeaterDeadlineValue: '2',
              repeaterDeadlineUnit: 'w',
              year: 2026,
              month: 1,
              day: 6,
            },
          },
        ],
        logBookEntries: [
          { raw: '- State "DONE"       from "TODO"       [2025-12-30 Tue 14:39]' },
          { raw: '- State "DONE"       from "TODO"       [2025-12-23 Tue 14:39]' },
        ],
      });

      const today = new Date('2026-01-07T12:00:00');

      const result = calculateHabitConsistency(header, today, {
        precedingDays: 7,
        followingDays: 7,
      });

      expect(result.length).toBeGreaterThan(0);
    });
  });
});
