
import fs from 'fs';
import path from 'path';
import peg from 'pegjs';

// TODO add tests

describe('Headline filter parser', () => {

  const grammar = fs.readFileSync(path.join(__dirname, './headline_filter_parser.grammar.js')).toString();
  const parser = peg.generate(grammar);

  describe('Parsing of tag filters', () => {
    const s = ':tag :foo|bar';
    const expr = parser.parse(s);
  });

  describe('Parsing of property filters', () => {
    const s = ':assignee:jak|nik :prop1: :prop2:test';
    const expr = parser.parse(s);
  });

  describe('Parsing of headline text filters', () => {
    const s = 'TODO|DONE Spec test';
    const expr = parser.parse(s);
  });

  describe('Parsing of alltogether', () => {
    const s = ':assignee:jak|nik TODO|DONE Spec test :tag :foo|bar';
    const expr = parser.parse(s);
    test('Parses all AND-terms', () => {
      expect(expr.length).toEqual(6);
    });
  });

});
