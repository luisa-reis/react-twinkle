import type {MonoFontDescription} from '../../src/fonts/mono';

// Fonts for the tests, made here: react-twinkle ships none, and the tests
// should not need anyone else's. A fixed-width font of a few 3x5 glyphs in
// 4x6 cells, and a writer of U8g2's font format to make a proportional one
// with.

/** A glyph of the proportional font: its pixels, and where it sits. */
export interface TestGlyph {
  rows: string[];
  offsetX?: number;
  offsetY?: number;
  advance: number;
}

const GLYPHS: Record<string, string[]> = {
  A: ['.#.', '#.#', '###', '#.#', '#.#'],
  D: ['##.', '#.#', '#.#', '#.#', '##.'],
  E: ['###', '#..', '##.', '#..', '###'],
  I: ['###', '.#.', '.#.', '.#.', '###'],
  W: ['#.#', '#.#', '#.#', '###', '#.#'],
  4: ['#.#', '#.#', '###', '..#', '..#'],
  '?': ['##.', '..#', '.#.', '...', '.#.'],
  é: ['.#.', '###', '#..', '###', '...'],
};

const CELL = {width: 4, height: 6};
const PER_ROW = 16;

/** The description of a 4x6 fixed-width font with the glyphs above. */
export function tinyMono(): MonoFontDescription {
  const bytesPerRow = (PER_ROW * CELL.width) / 8;
  const data = new Uint8Array(bytesPerRow * CELL.height * 12);
  Object.entries(GLYPHS).forEach(([character, rows]) => {
    const code = character.codePointAt(0) as number;
    const index = code <= 0x7f ? code - 0x20 : code - 0xa0 + 96;
    const left = (index % PER_ROW) * CELL.width;
    const top = Math.floor(index / PER_ROW) * CELL.height;
    rows.forEach((row, y) => {
      Array.from(row).forEach((pixel, x) => {
        if (pixel === '#') {
          const bit = left + x;
          data[(top + y) * bytesPerRow + Math.floor(bit / 8)] += 128 / 2 ** (bit % 8);
        }
      });
    });
  });
  return {...CELL, baseline: 4, glyphsPerRow: PER_ROW, data};
}

// Collects numbers a few bits at a time, lowest bits first.
function bitWriter() {
  const bits: number[] = [];
  return {
    put(value: number, count: number): void {
      for (let i = 0; i < count; i += 1) {
        bits.push(Math.floor(value / 2 ** i) % 2);
      }
    },
    bytes(): number[] {
      const out: number[] = new Array(Math.ceil(bits.length / 8)).fill(0);
      bits.forEach((bit, i) => {
        out[Math.floor(i / 8)] += bit * 2 ** (i % 8);
      });
      return out;
    },
  };
}

const RUN_BITS = [2, 3];
const FIELD_BITS = {width: 4, height: 4, x: 3, y: 3, advance: 4};

// A glyph's pixels as runs of unlit then lit ones, none longer than its
// field holds.
function runs(rows: string[]): [number, number][] {
  const [maxZeros, maxOnes] = RUN_BITS.map((bits) => 2 ** bits - 1);
  const out: [number, number][] = [];
  let zeros = 0;
  let ones = 0;
  const flush = () => {
    out.push([zeros, ones]);
    zeros = 0;
    ones = 0;
  };
  Array.from(rows.join('')).forEach((pixel) => {
    if (pixel === '#') {
      if (ones === maxOnes) {
        flush();
      }
      ones += 1;
    } else {
      if (ones > 0 || zeros === maxZeros) {
        flush();
      }
      zeros += 1;
    }
  });
  flush();
  return out;
}

function glyphBytes(glyph: TestGlyph): number[] {
  const {rows, offsetX = 0, offsetY = 0, advance} = glyph;
  const writer = bitWriter();
  writer.put(rows[0]?.length ?? 0, FIELD_BITS.width);
  writer.put(rows.length, FIELD_BITS.height);
  writer.put(offsetX + 2 ** (FIELD_BITS.x - 1), FIELD_BITS.x);
  writer.put(offsetY + 2 ** (FIELD_BITS.y - 1), FIELD_BITS.y);
  writer.put(advance + 2 ** (FIELD_BITS.advance - 1), FIELD_BITS.advance);
  let last: [number, number] | undefined;
  runs(rows).forEach(([zeros, ones]) => {
    // After a pair comes a bit: set, the pair is drawn again.
    if (last && last[0] === zeros && last[1] === ones) {
      writer.put(1, 1);
    } else {
      if (last) {
        writer.put(0, 1);
      }
      writer.put(zeros, RUN_BITS[0]);
      writer.put(ones, RUN_BITS[1]);
    }
    last = [zeros, ones];
  });
  writer.put(0, 1);
  writer.put(0, RUN_BITS[0] + RUN_BITS[1]);
  return writer.bytes();
}

/**
 * The bytes of a U8g2 font with `glyphs`, a map of character to
 * `{ rows, offsetX, offsetY, advance }`, `rows` its pixels as strings of
 * '#' and '.', `offsetY` how far its bottom is above the baseline.
 */
export function u8g2Bytes(
  glyphs: Record<string, TestGlyph>,
  {ascent = 5, descent = -1}: {ascent?: number; descent?: number} = {},
): Uint8Array {
  const entries = Object.entries(glyphs)
    .map(([character, glyph]): [number, number[]] => [
      character.codePointAt(0) as number,
      glyphBytes(glyph),
    ])
    .sort(([a], [b]) => a - b);
  const low = entries.filter(([code]) => code <= 255);
  const high = entries.filter(([code]) => code > 255);
  const body: number[] = [];
  const offsets: {upper: number | undefined; lower: number | undefined} = {
    upper: undefined,
    lower: undefined,
  };
  low.forEach(([code, bytes]) => {
    if (code >= 0x41 && offsets.upper === undefined) {
      offsets.upper = body.length;
    }
    if (code >= 0x61 && offsets.lower === undefined) {
      offsets.lower = body.length;
    }
    body.push(code, bytes.length + 2, ...bytes);
  });
  const end = body.length;
  body.push(0, 0);
  const unicode = body.length;
  // One entry in the jump table: skip the table itself, for any code.
  body.push(0, 4, 0xff, 0xff);
  high.forEach(([code, bytes]) => {
    body.push(Math.floor(code / 256), code % 256, bytes.length + 3, ...bytes);
  });
  body.push(0, 0, 0);
  const word = (value: number) => [Math.floor(value / 256), value % 256];
  const signed = (value: number) => (value + 256) % 256;
  return Uint8Array.from([
    entries.length,
    0,
    ...RUN_BITS,
    FIELD_BITS.width,
    FIELD_BITS.height,
    FIELD_BITS.x,
    FIELD_BITS.y,
    FIELD_BITS.advance,
    6,
    7,
    0,
    signed(descent),
    signed(ascent),
    signed(descent),
    signed(ascent),
    signed(descent),
    ...word(offsets.upper ?? end),
    ...word(offsets.lower ?? end),
    ...word(unicode),
    ...body,
  ]);
}

/** The glyphs of the proportional test font. */
export const PROPORTIONAL: Record<string, TestGlyph> = {
  T: {rows: ['#####', '..#..', '..#..', '..#..', '..#..'], advance: 6},
  i: {rows: ['#', '.', '#', '#', '#'], advance: 2},
  l: {rows: ['#', '#', '#', '#', '#'], advance: 2},
  M: {rows: ['#...#', '##.##', '#.#.#', '#...#', '#...#'], advance: 6},
  g: {rows: ['.##', '#.#', '.##', '..#', '##.'], offsetY: -2, advance: 4},
  ' ': {rows: [], advance: 3},
  '☃': {rows: ['.#.', '###', '.#.'], offsetY: 1, advance: 4},
};
