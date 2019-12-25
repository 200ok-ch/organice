
import fs from 'fs';
import path from 'path';
import peg from 'pegjs';

describe('Headline filter parser', () => {

  const grammar = fs.readFileSync(path.join(__dirname, './headline_filter_parser.grammar.js')).toString();
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
    const s = ':assignee:jak|nik TODO|DONE Spec test :tag :foo|bar';
    const expr = parser.parse(s);
    test('Parses all AND-terms', () => {
      expect(expr.length).toEqual(6);
    });
  });

});
