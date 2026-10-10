import {describe, expect, it} from 'vitest';
import Canvas from '../src/canvas';
import Surface from '../src/graphics/surface';
import {drawRect, fillRect} from '../src/graphics/rect';
import {circleOutline, drawCircle} from '../src/graphics/circle';
import {linePoints, polylinePoints} from '../src/graphics/line';
import {mix, parseColor, scaleAlpha} from '../src/color';

const WHITE = {r: 255, g: 255, b: 255, a: 255};
const RED = {r: 255, g: 0, b: 0, a: 255};

function rows(canvas: Canvas): string[] {
  const out: string[] = [];
  for (let y = 0; y < canvas.height; y += 1) {
    let row = '';
    for (let x = 0; x < canvas.width; x += 1) {
      const {r, g} = canvas.get(x, y);
      const lit = g ? '#' : 'r';
      row += r ? lit : '.';
    }
    out.push(row);
  }
  return out;
}

describe('canvas', () => {
  it('blends by alpha, rounding to nearest', () => {
    const canvas = new Canvas(1, 1);
    canvas.set(0, 0, {r: 200, g: 100, b: 0, a: 255});
    canvas.set(0, 0, {r: 0, g: 0, b: 255, a: 128});
    expect(canvas.get(0, 0)).toEqual({r: 100, g: 50, b: 128});
    canvas.set(5, 5, WHITE);
  });

  it('clips to a box and offsets into it', () => {
    const canvas = new Canvas(4, 4);
    const box = new Surface(canvas).child(1, 1, 2, 2, true);
    fillRect(box, -1, 0, 4, 1, WHITE);
    expect(rows(canvas)).toEqual(['....', '.##.', '....', '....']);
  });
});

describe('colours', () => {
  it('parses and scales', () => {
    expect(parseColor('#ff8000')).toEqual({r: 255, g: 128, b: 0, a: 255});
    expect(parseColor('#ff800040').a).toBe(64);
    expect(() => parseColor('ff8000')).toThrow(/a colour is/);
    expect(scaleAlpha(WHITE, 0.35).a).toBe(89);
    expect(scaleAlpha(WHITE, 2).a).toBe(255);
  });

  it('mixes every channel', () => {
    const from = {r: 0, g: 100, b: 255, a: 255};
    const to = {r: 200, g: 100, b: 55, a: 0};
    expect(mix(from, to, 0)).toEqual(from);
    expect(mix(from, to, 1)).toEqual(to);
    expect(mix(from, to, 0.5)).toEqual({r: 100, g: 100, b: 155, a: 128});
  });
});

describe('rectangles', () => {
  it('strokes the outermost pixels', () => {
    const canvas = new Canvas(5, 4);
    drawRect(new Surface(canvas), {x: 0, y: 0, width: 5, height: 4}, {stroke: WHITE, fill: RED});
    expect(rows(canvas)).toEqual(['#####', '#rrr#', '#rrr#', '#####']);
  });
});

describe('circles', () => {
  it('fills small ones round', () => {
    const canvas = new Canvas(5, 5);
    drawCircle(new Surface(canvas), {x: 0, y: 0, diameter: 5}, {fill: WHITE});
    expect(rows(canvas)).toEqual(['.###.', '#####', '#####', '#####', '.###.']);
  });

  it('strokes a ring one pixel wide', () => {
    const canvas = new Canvas(7, 7);
    drawCircle(new Surface(canvas), {x: 0, y: 0, diameter: 7}, {stroke: WHITE});
    expect(rows(canvas)).toEqual([
      '..###..',
      '.#...#.',
      '#.....#',
      '#.....#',
      '#.....#',
      '.#...#.',
      '..###..',
    ]);
    expect(circleOutline({x: 0, y: 0, diameter: 7}).slice(0, 5)).toEqual([
      [2, 0],
      [3, 0],
      [4, 0],
      [1, 1],
      [5, 1],
    ]);
  });
});

describe('lines', () => {
  it('steps along the longer axis', () => {
    expect(linePoints([0, 0], [3, 1])).toEqual([
      [0, 0],
      [1, 0],
      [2, 1],
      [3, 1],
    ]);
    expect(linePoints([2, 2], [2, 0])).toEqual([
      [2, 2],
      [2, 1],
      [2, 0],
    ]);
  });

  it('draws a joint once', () => {
    const points = polylinePoints([
      [0, 0],
      [2, 0],
      [2, 2],
    ]);
    expect(points).toEqual([
      [0, 0],
      [1, 0],
      [2, 0],
      [2, 1],
      [2, 2],
    ]);
    expect(polylinePoints([[1, 1]])).toEqual([]);
  });
});
