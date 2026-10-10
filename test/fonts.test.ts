import {beforeEach, describe, expect, it} from 'vitest';
import {
  DEFAULT_FONT,
  clearFonts,
  fontNames,
  getFont,
  measureText,
  registerFont,
  registerMonoFont,
  registerU8g2Font,
  setDefaultFont,
} from '../src/fonts';
import type {Font} from '../src/fonts';
import Canvas from '../src/canvas';
import Surface from '../src/graphics/surface';
import {PROPORTIONAL, tinyMono, u8g2Bytes} from './support/fonts';

const WHITE = {r: 255, g: 255, b: 255, a: 255};

// The lit pixels of a canvas as rows of '#' and '.'.
function rows(canvas: Canvas): string[] {
  const out: string[] = [];
  for (let y = 0; y < canvas.height; y += 1) {
    let row = '';
    for (let x = 0; x < canvas.width; x += 1) {
      row += canvas.get(x, y).r ? '#' : '.';
    }
    out.push(row);
  }
  return out;
}

beforeEach(() => {
  clearFonts();
  registerMonoFont('tiny', tinyMono());
  registerU8g2Font('prop', u8g2Bytes(PROPORTIONAL));
});

describe('the registry', () => {
  it('has only what the application registered', () => {
    expect(fontNames()).toEqual(['tiny', 'prop']);
    expect(() => getFont('helvB08')).toThrow(/no font named helvB08 \(registered: tiny, prop\)/);
    clearFonts();
    expect(() => getFont()).toThrow(/no font is registered/);
  });

  it('draws in the first font, or the one made the default', () => {
    expect(getFont().name).toBe('tiny');
    expect(getFont(DEFAULT_FONT).name).toBe('tiny');
    setDefaultFont('prop');
    expect(getFont().name).toBe('prop');
    expect(() => setDefaultFont('nope')).toThrow(/no font named nope/);
    expect(() => registerFont(DEFAULT_FONT, getFont('tiny'))).toThrow(
      /stands for the default font/,
    );
  });

  it('takes any object that draws as a font', () => {
    const font: Font = {
      kind: 'mine',
      advance: (text) => text.length * 2,
      inkWidth: (text) => text.length * 2,
      extent: () => ({up: 0, down: 0}),
      draw() {},
    };
    registerFont('mine', font);
    expect(getFont('mine')).toBe(font);
    expect(measureText('abc', 'mine')).toBe(6);
  });
});

describe('fixed-width fonts', () => {
  it('draw a glyph from the image', () => {
    const canvas = new Canvas(4, 6);
    getFont('tiny').draw(new Surface(canvas), 'A', 0, 0, WHITE);
    expect(rows(canvas)).toEqual(['.#..', '#.#.', '###.', '#.#.', '#.#.', '....']);
  });

  it('draw Latin-1, and a question mark for anything else', () => {
    const [accent, snowman, mark] = [new Canvas(4, 6), new Canvas(4, 6), new Canvas(4, 6)];
    getFont('tiny').draw(new Surface(accent), 'é', 0, 0, WHITE);
    getFont('tiny').draw(new Surface(snowman), '☃', 0, 0, WHITE);
    getFont('tiny').draw(new Surface(mark), '?', 0, 0, WHITE);
    expect(rows(accent)[1]).toBe('###.');
    expect(rows(snowman)).toEqual(rows(mark));
  });

  it('measure by the character', () => {
    expect(measureText('KITCHEN', 'tiny')).toBe(27);
    expect(getFont('tiny').advance('ab')).toBe(8);
    expect(getFont('tiny').extent()).toEqual({up: 4, down: 2});
  });
});

describe('U8g2 fonts', () => {
  it('draw a glyph from its runs, on the baseline', () => {
    const canvas = new Canvas(6, 6);
    getFont('prop').draw(new Surface(canvas), 'T', 0, 5, WHITE);
    expect(rows(canvas)).toEqual(['#####.', '..#...', '..#...', '..#...', '..#...', '......']);
  });

  it('move the pen by each glyph’s own advance, and hang descenders', () => {
    const canvas = new Canvas(10, 7);
    getFont('prop').draw(new Surface(canvas), 'ilg', 0, 5, WHITE);
    expect(rows(canvas)).toEqual([
      '#.#.......',
      '..#.......',
      '#.#..##...',
      '#.#.#.#...',
      '#.#..##...',
      '......#...',
      '....##....',
    ]);
    expect(getFont('prop').advance('il')).toBeLessThan(getFont('prop').advance('MT'));
    expect(getFont('prop').advance('a b')).toBe(3);
  });

  it('find glyphs beyond Latin-1 and leave out those the font lacks', () => {
    const canvas = new Canvas(8, 6);
    getFont('prop').draw(new Surface(canvas), 'z☃é', 0, 5, WHITE);
    expect(rows(canvas).slice(1, 4)).toEqual(['.#......', '###.....', '.#......']);
    expect(getFont('prop').advance('\u{1f600}')).toBe(0);
  });

  it('know how far a line rises and falls', () => {
    expect(getFont('prop').extent()).toEqual({up: 5, down: 2});
    registerU8g2Font('flat', u8g2Bytes({T: PROPORTIONAL.T}, {ascent: 7, descent: 0}));
    expect(getFont('flat').extent()).toEqual({up: 7, down: 0});
  });
});
