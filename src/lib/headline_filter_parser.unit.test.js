/* eslint jest/expect-expect: ["error", { "assertFunctionNames": ["expect", "expectFirstParseResultExclude", "expectStrings", "expectField"] }] */

import parser from './headline_filter_parser';

describe('Headline filter parser', () => {
  describe('Parsing of tag filters', () => {
    const s = ':tax :foo|bar';
    const expr = parser.parse(s);
    test('Parses as tag filter', () => {
      expect(expr[0].type).toEqual('tag');
    });
    test('Parses single tag name', () => {
      expect(expr[0].words).toEqual(['tax']);
    });
    test('Parses alternatives', () => {
      expect(expr[1].words).toEqual(['foo', 'bar']);
    });
  });

  describe('Parser fails with invalid syntax but this is OK', () => {
    test('Parser fails when beginning to type a tag', () => {
      expect(() => parser.parse(':')).toThrowError();
    });
    test('Parser fails when ending with a |', () => {
      expect(() => parser.parse('a|')).toThrowError();
    });
  });

  describe('Parsing of property filters', () => {
    const s = ':assignee:jak|nik :prop1: :prop2:test';
    const expr = parser.parse(s);
    test('Parses as property filter', () => {
      expect(expr[0].type).toEqual('property');
      expect(expr[1].type).toEqual('property');
      expect(expr[2].type).toEqual('property');
    });
    test('Parses property name', () => {
      expect(expr[0].property).toEqual('assignee');
    });
    test('Parses alternatives', () => {
      expect(expr[0].words).toEqual(['jak', 'nik']);
    });
    test('Parses empty value', () => {
      expect(expr[1].words).toEqual(['']);
    });
    test('Parses single value', () => {
      expect(expr[2].words).toEqual(['test']);
    });
  });

  describe('Parsing of headline text filters', () => {
    const s = 'TODO|DONE Spec test url|URL';
    const expr = parser.parse(s);
    test('Parses alternatives', () => {
      expect(expr[0].words).toEqual(['TODO', 'DONE']);
    });
    test('Parses single case-sensitive', () => {
      expect(expr[1].type).toEqual('case-sensitive');
    });
    test('Parses as ignore-case filter', () => {
      expect(expr[2].type).toEqual('ignore-case');
    });
    test('Parses alternatives case-sensitive', () => {
      expect(expr[3].type).toEqual('case-sensitive');
    });
  });

  describe('Parsing of exclude-terms', () => {
    const expectFirstParseResultExclude = (s) => expect(parser.parse(s)[0].exclude);
    test('Parses text filter', () => {
      expectFirstParseResultExclude('-text').toBe(true);
      expectFirstParseResultExclude('text').toBe(false);
    });
    test('Parses tag filter', () => {
      expectFirstParseResultExclude('-:tag').toBe(true);
      expectFirstParseResultExclude(':tag').toBe(false);
    });
    test('Parses property filter', () => {
      expectFirstParseResultExclude('-:prop1:foo').toBe(true);
      expectFirstParseResultExclude(':prop1:foo').toBe(false);
    });
  });

  describe('Parsing of quoted strings', () => {
    const expectStrings = (s) => expect(parser.parse(s)[0].words);
    test('Parses a double-quoted string', () => {
      expectStrings('"a b"').toEqual(['a b']);
    });
    test('Parses a single-quoted string', () => {
      expectStrings("'a b'").toEqual(['a b']);
    });
    test('Parses a single-quoted string with alternatives', () => {
      expectStrings("'a b'|'c d'").toEqual(['a b', 'c d']);
    });
    test('Not parses a quoted empty string, because that is bad input for the matcher', () => {
      // The empty string would only make sense for property matching, but that
      // must be currently done with this filter string: :prop1:
      expect(() => expectStrings("''")).toThrowError();
    });
    test('Parses a quoted string in a property filter term', () => {
      expectStrings(":prop1:'a b'").toEqual(['a b']);
    });
  });

  describe('Parsing of Timeranges', () => {
    const expectField = (s) => expect(parser.parse(s)[0].field);
    const all = (searchterm) => ({
      type: searchterm,
      timerange: {
        type: 'all',
      },
    });

    test('Parses all kind of time searchterms (with open ranges)', () => {
      expectField('clock:..').toEqual(all('clock'));
      expectField('sched:..').toEqual(all('scheduled'));
      expectField('scheduled:..').toEqual(all('scheduled'));
      expectField('dead:..').toEqual(all('deadline'));
      expectField('deadline:..').toEqual(all('deadline'));
      expectField('date:..').toEqual(all('date'));
    });

    test('Parses single Timestamps', () => {
      expectField('date:2020').toEqual({
        type: 'date',
        timerange: {
          type: 'point',
          point: {
            type: 'timestamp',
            year: 2020,
            month: null,
            day: null,
          },
        },
      });
      expectField('date:2020-07').toEqual({
        type: 'date',
        timerange: {
          type: 'point',
          point: {
            type: 'timestamp',
            year: 2020,
            month: 7,
            day: null,
          },
        },
      });
      expectField('date:2020-07-05').toEqual({
        type: 'date',
        timerange: {
          type: 'point',
          point: {
            type: 'timestamp',
            year: 2020,
            month: 7,
            day: 5,
          },
        },
      });
      expectField('date:202007').toEqual({
        type: 'date',
        timerange: {
          type: 'point',
          point: {
            type: 'timestamp',
            year: 2020,
            month: 7,
            day: null,
          },
        },
      });
      expectField('date:20200705').toEqual({
        type: 'date',
        timerange: {
          type: 'point',
          point: {
            type: 'timestamp',
            year: 2020,
            month: 7,
            day: 5,
          },
        },
      });
      expectField('date:2020.07').toEqual({
        type: 'date',
        timerange: {
          type: 'point',
          point: {
            type: 'timestamp',
            year: 2020,
            month: 7,
            day: null,
          },
        },
      });
      expectField('date:2020.07.05').toEqual({
        type: 'date',
        timerange: {
          type: 'point',
          point: {
            type: 'timestamp',
            year: 2020,
            month: 7,
            day: 5,
          },
        },
      });
      expectField('date:2020/07').toEqual({
        type: 'date',
        timerange: {
          type: 'point',
          point: {
            type: 'timestamp',
            year: 2020,
            month: 7,
            day: null,
          },
        },
      });
      expectField('date:2020/07/05').toEqual({
        type: 'date',
        timerange: {
          type: 'point',
          point: {
            type: 'timestamp',
            year: 2020,
            month: 7,
            day: 5,
          },
        },
      });
    });

    test('Parses single TimeUnits', () => {
      expectField('date:h').toEqual({
        type: 'date',
        timerange: {
          type: 'point',
          point: {
            type: 'unit',
            unit: 'h',
          },
        },
      });
      expectField('date:d').toEqual({
        type: 'date',
        timerange: {
          type: 'point',
          point: {
            type: 'unit',
            unit: 'd',
          },
        },
      });
      expectField('date:w').toEqual({
        type: 'date',
        timerange: {
          type: 'point',
          point: {
            type: 'unit',
            unit: 'w',
          },
        },
      });
      expectField('date:m').toEqual({
        type: 'date',
        timerange: {
          type: 'point',
          point: {
            type: 'unit',
            unit: 'm',
          },
        },
      });
      expectField('date:y').toEqual({
        type: 'date',
        timerange: {
          type: 'point',
          point: {
            type: 'unit',
            unit: 'y',
          },
        },
      });
    });

    test('Parsing single offsets (interpreted as ranges now..offset)', () => {
      expectField('date:1h').toEqual({
        type: 'date',
        timerange: {
          type: 'point',
          point: {
            type: 'offset',
            unit: 'h',
            value: 1,
          },
        },
      });
      expectField('date:45d').toEqual({
        type: 'date',
        timerange: {
          type: 'point',
          point: {
            type: 'offset',
            unit: 'd',
            value: 45,
          },
        },
      });
      expectField('date:962w').toEqual({
        type: 'date',
        timerange: {
          type: 'point',
          point: {
            type: 'offset',
            unit: 'w',
            value: 962,
          },
        },
      });
      expectField('date:0000378y').toEqual({
        type: 'date',
        timerange: {
          type: 'point',
          point: {
            type: 'offset',
            unit: 'y',
            value: 378,
          },
        },
      });
    });

    test('Parse special time keywords', () => {
      expectField('date:now').toEqual({
        type: 'date',
        timerange: {
          type: 'point',
          point: {
            type: 'special',
            value: 'now',
          },
        },
      });
      expectField('date:today').toEqual({
        type: 'date',
        timerange: {
          type: 'point',
          point: {
            type: 'special',
            value: 'today',
          },
        },
      });
    });

    test('Parse Timestamp ranges', () => {
      expectField('date:2019..2020').toEqual({
        type: 'date',
        timerange: {
          type: 'range',
          from: {
            type: 'timestamp',
            year: 2019,
            month: null,
            day: null,
          },
          to: {
            type: 'timestamp',
            year: 2020,
            month: null,
            day: null,
          },
        },
      });
      expectField('date:2019-10..2020').toEqual({
        type: 'date',
        timerange: {
          type: 'range',
          from: {
            type: 'timestamp',
            year: 2019,
            month: 10,
            day: null,
          },
          to: {
            type: 'timestamp',
            year: 2020,
            month: null,
            day: null,
          },
        },
      });
      expectField('date:2019-11-30..2020').toEqual({
        type: 'date',
        timerange: {
          type: 'range',
          from: {
            type: 'timestamp',
            year: 2019,
            month: 11,
            day: 30,
          },
          to: {
            type: 'timestamp',
            year: 2020,
            month: null,
            day: null,
          },
        },
      });
      expectField('date:2019..2020-05').toEqual({
        type: 'date',
        timerange: {
          type: 'range',
          from: {
            type: 'timestamp',
            year: 2019,
            month: null,
            day: null,
          },
          to: {
            type: 'timestamp',
            year: 2020,
            month: 5,
            day: null,
          },
        },
      });
      expectField('date:2019..2020-05-15').toEqual({
        type: 'date',
        timerange: {
          type: 'range',
          from: {
            type: 'timestamp',
            year: 2019,
            month: null,
            day: null,
          },
          to: {
            type: 'timestamp',
            year: 2020,
            month: 5,
            day: 15,
          },
        },
      });
      expectField('date:2019-11..2020-05').toEqual({
        type: 'date',
        timerange: {
          type: 'range',
          from: {
            type: 'timestamp',
            year: 2019,
            month: 11,
            day: null,
          },
          to: {
            type: 'timestamp',
            year: 2020,
            month: 5,
            day: null,
          },
        },
      });
      expectField('date:2019-11..2020-05-21').toEqual({
        type: 'date',
        timerange: {
          type: 'range',
          from: {
            type: 'timestamp',
            year: 2019,
            month: 11,
            day: null,
          },
          to: {
            type: 'timestamp',
            year: 2020,
            month: 5,
            day: 21,
          },
        },
      });
      expectField('date:2019-01-30..2020').toEqual({
        type: 'date',
        timerange: {
          type: 'range',
          from: {
            type: 'timestamp',
            year: 2019,
            month: 1,
            day: 30,
          },
          to: {
            type: 'timestamp',
            year: 2020,
            month: null,
            day: null,
          },
        },
      });
      expectField('date:2019-01-30..2020-10').toEqual({
        type: 'date',
        timerange: {
          type: 'range',
          from: {
            type: 'timestamp',
            year: 2019,
            month: 1,
            day: 30,
          },
          to: {
            type: 'timestamp',
            year: 2020,
            month: 10,
            day: null,
          },
        },
      });
      expectField('date:2019-01-30..2020-10-22').toEqual({
        type: 'date',
        timerange: {
          type: 'range',
          from: {
            type: 'timestamp',
            year: 2019,
            month: 1,
            day: 30,
          },
          to: {
            type: 'timestamp',
            year: 2020,
            month: 10,
            day: 22,
          },
        },
      });
    });

    test('Parse offsets in ranges', () => {
      expectField('date:3422d..2020').toEqual({
        type: 'date',
        timerange: {
          type: 'range',
          from: {
            type: 'offset',
            unit: 'd',
            value: 3422,
          },
          to: {
            type: 'timestamp',
            year: 2020,
            month: null,
            day: null,
          },
        },
      });
      expectField('date:1985-05..8m').toEqual({
        type: 'date',
        timerange: {
          type: 'range',
          from: {
            type: 'timestamp',
            year: 1985,
            month: 5,
            day: null,
          },
          to: {
            type: 'offset',
            unit: 'm',
            value: 8,
          },
        },
      });
      expectField('date:1y..8m').toEqual({
        type: 'date',
        timerange: {
          type: 'range',
          from: {
            type: 'offset',
            unit: 'y',
            value: 1,
          },
          to: {
            type: 'offset',
            unit: 'm',
            value: 8,
          },
        },
      });
    });

    test('Parse unit ranges', () => {
      expectField('date:..m').toEqual({
        type: 'date',
        timerange: {
          type: 'range',
          from: null,
          to: {
            type: 'unit',
            unit: 'm',
          },
        },
      });
      expectField('date:w..').toEqual({
        type: 'date',
        timerange: {
          type: 'range',
          from: {
            type: 'unit',
            unit: 'w',
          },
          to: null,
        },
      });
      expectField('date:y..h').toEqual({
        type: 'date',
        timerange: {
          type: 'range',
          from: {
            type: 'unit',
            unit: 'y',
          },
          to: {
            type: 'unit',
            unit: 'h',
          },
        },
      });
    });

    test('Parse special values in ranges', () => {
      expectField('date:now..').toEqual({
        type: 'date',
        timerange: {
          type: 'range',
          from: {
            type: 'special',
            value: 'now',
          },
          to: null,
        },
      });
      expectField('date:..now').toEqual({
        type: 'date',
        timerange: {
          type: 'range',
          from: null,
          to: {
            type: 'special',
            value: 'now',
          },
        },
      });
      expectField('date:today..').toEqual({
        type: 'date',
        timerange: {
          type: 'range',
          from: {
            type: 'special',
            value: 'today',
          },
          to: null,
        },
      });
      expectField('date:..today').toEqual({
        type: 'date',
        timerange: {
          type: 'range',
          from: null,
          to: {
            type: 'special',
            value: 'today',
          },
        },
      });
      expectField('date:now..now').toEqual({
        type: 'date',
        timerange: {
          type: 'range',
          from: {
            type: 'special',
            value: 'now',
          },
          to: {
            type: 'special',
            value: 'now',
          },
        },
      });
      expectField('date:today..today').toEqual({
        type: 'date',
        timerange: {
          type: 'range',
          from: {
            type: 'special',
            value: 'today',
          },
          to: {
            type: 'special',
            value: 'today',
          },
        },
      });
      expectField('date:today..now').toEqual({
        type: 'date',
        timerange: {
          type: 'range',
          from: {
            type: 'special',
            value: 'today',
          },
          to: {
            type: 'special',
            value: 'now',
          },
        },
      });
      expectField('date:now..today').toEqual({
        type: 'date',
        timerange: {
          type: 'range',
          from: {
            type: 'special',
            value: 'now',
          },
          to: {
            type: 'special',
            value: 'today',
          },
        },
      });
    });

    test('Parses half defined timestamp ranges', () => {
      expectField('date:2019-01-30..').toEqual({
        type: 'date',
        timerange: {
          type: 'range',
          from: {
            type: 'timestamp',
            year: 2019,
            month: 1,
            day: 30,
          },
          to: null,
        },
      });
      expectField('date:..2019-01-30').toEqual({
        type: 'date',
        timerange: {
          type: 'range',
          from: null,
          to: {
            type: 'timestamp',
            year: 2019,
            month: 1,
            day: 30,
          },
        },
      });
    });

    test(`Doesn't parse illegal dates`, () => {
      // Chrome accepts days up to 31 for all months and maps them onto the first days of the following month
      expect(() => parser.parse('date:2019-11-32')).toThrowError();
      expect(() => parser.parse('date:2019-00')).toThrowError();
      expect(() => parser.parse('date:2019-13')).toThrowError();
    });
  });

  describe('Parsing of alltogether', () => {
    const s1 = ':assignee:jak|nik TODO|DONE Spec test -doc :tag :foo|bar';
    const s2 = ' ';
    const s3 = '';
    test('Parses all AND-terms', () => {
      const expr = parser.parse(s1);
      expect(expr.length).toEqual(7);
    });
    test('Parses blank line with whitespace', () => {
      const expr = parser.parse(s2);
      expect(expr).toEqual([]);
    });
    test('Parses blank line', () => {
      const expr = parser.parse(s3);
      expect(expr).toEqual([]);
    });
  });
});
