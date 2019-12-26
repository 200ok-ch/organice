import peg from 'pegjs';

import { grammar } from './headline_filter_parser.grammar';

describe('Headline filter parser', () => {
  const parser = peg.generate(grammar);

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

  describe('Parsing of property filters', () => {
    const s = ':assignee:jak|nik :prop1: :prop2:test';
    const expr = parser.parse(s);
    test('Parses as property filter', () => {
      expect(expr[0].type).toEqual('property');
      expect(expr[1].type).toEqual('property');
      expect(expr[2].type).toEqual('property');
    });
    test('Parses property name', () => {
      expect(expr[0].key).toEqual('assignee');
    });
    test('Parses alternatives', () => {
      expect(expr[0].value).toEqual(['jak', 'nik']);
    });
    test('Parses empty value', () => {
      expect(expr[1].value).toEqual(['']);
    });
    test('Parses single value', () => {
      expect(expr[2].value).toEqual(['test']);
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

  describe('Parsing of alltogether', () => {
    const s1 = ':assignee:jak|nik TODO|DONE Spec test :tag :foo|bar';
    const s2 = ' ';
    const s3 = '';
    test('Parses all AND-terms', () => {
      const expr = parser.parse(s1);
      expect(expr.length).toEqual(6);
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
