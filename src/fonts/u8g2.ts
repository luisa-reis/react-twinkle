// The U8g2 fonts, read from U8g2's own compressed format: a 23-byte header,
// then the glyphs one after another, each a few bit-packed numbers and its
// pixels as run lengths. Most are proportional. The library has none of
// its own: the application registers those it draws with.
import type {Color} from '../color';
import type {Point} from '../graphics/line';
import type Surface from '../graphics/surface';
import BitReader from './bit-reader';
import type {Font, FontExtent} from './index';

/**
 * A character's glyph: its size, where it sits from the pen, how far it
 * moves the pen, and its lit pixels as [x, y] from its top-left corner.
 */
export interface U8g2Glyph {
  width: number;
  height: number;
  offsetX: number;
  offsetY: number;
  advance: number;
  pixels: Point[];
}

const HEADER = 23;
const signed = (byte: number) => (byte << 24) >> 24;

export default class U8g2Font implements Font {
  kind: 'u8g2';

  name: string;

  bytes: Uint8Array;

  runBits0: number;

  runBits1: number;

  bitsW: number;

  bitsH: number;

  bitsX: number;

  bitsY: number;

  bitsD: number;

  ascent: number;

  descent: number;

  offsetUpperA: number;

  offsetLowerA: number;

  offsetUnicode: number;

  glyphs: Map<number, U8g2Glyph | undefined>;

  /** A font called `name` from the bytes of a U8g2 font, a Uint8Array. */
  constructor(name: string, bytes: Uint8Array) {
    const word = (at: number) => (bytes[at] << 8) | bytes[at + 1];
    this.kind = 'u8g2';
    this.name = name;
    this.bytes = bytes;
    [, , this.runBits0, this.runBits1] = bytes;
    [this.bitsW, this.bitsH, this.bitsX, this.bitsY, this.bitsD] = bytes.subarray(4, 9);
    /** The font's own rise above the baseline and (negative) fall below it. */
    this.ascent = signed(bytes[13]);
    this.descent = signed(bytes[14]);
    this.offsetUpperA = word(17);
    this.offsetLowerA = word(19);
    this.offsetUnicode = word(21);
    this.glyphs = new Map();
  }

  // Where a character's glyph starts in the data, after its code and the
  // jump to the next one; nothing when the font does not have it.
  find(codePoint: number): number | undefined {
    const {bytes} = this;
    let at = HEADER;
    if (codePoint <= 255) {
      if (codePoint >= 0x61) {
        at += this.offsetLowerA;
      } else if (codePoint >= 0x41) {
        at += this.offsetUpperA;
      }
      while (bytes[at] !== codePoint) {
        if (bytes[at + 1] === 0) {
          return undefined;
        }
        at += bytes[at + 1];
      }
      return at + 2;
    }
    if (codePoint > 0xffff) {
      return undefined;
    }
    // Beyond Latin-1 a table says how far to jump for a range of codes.
    at += this.offsetUnicode;
    let table = at;
    let jump = 0;
    let limit: number;
    do {
      if (table + 4 > bytes.length) {
        return undefined;
      }
      jump += (bytes[table] << 8) | bytes[table + 1];
      limit = (bytes[table + 2] << 8) | bytes[table + 3];
      table += 4;
    } while (limit < codePoint);
    at += jump;
    for (;;) {
      const code = (bytes[at] << 8) | bytes[at + 1];
      if (code === 0) {
        return undefined;
      }
      if (code === codePoint) {
        return at + 3;
      }
      if (bytes[at + 2] === 0) {
        return undefined;
      }
      at += bytes[at + 2];
    }
  }

  /**
   * A character's glyph: its size, where it sits from the pen, how far it
   * moves the pen, and its lit pixels as [x, y] from its top-left corner.
   * Nothing for a character the font does not have.
   */
  glyph(codePoint: number): U8g2Glyph | undefined {
    if (!this.glyphs.has(codePoint)) {
      this.glyphs.set(codePoint, this.read(codePoint));
    }
    return this.glyphs.get(codePoint);
  }

  read(codePoint: number): U8g2Glyph | undefined {
    const at = this.find(codePoint);
    if (at === undefined) {
      return undefined;
    }
    const bits = new BitReader(this.bytes, at);
    const width = bits.unsigned(this.bitsW);
    const height = bits.unsigned(this.bitsH);
    const offsetX = bits.signed(this.bitsX);
    const offsetY = bits.signed(this.bitsY);
    const advance = bits.signed(this.bitsD);
    const pixels: Point[] = [];
    if (width > 0 && height > 0) {
      // Runs of unlit then lit pixels, wrapping at the glyph's width; a set
      // bit after a pair of runs repeats the pair.
      let zeros = bits.unsigned(this.runBits0);
      let ones = bits.unsigned(this.runBits1);
      let x = zeros;
      let y = 0;
      const wrap = () => {
        while (x >= width) {
          x -= width;
          y += 1;
        }
      };
      wrap();
      while (y < height) {
        for (let i = 0; i < ones && y < height; i += 1) {
          pixels.push([x, y]);
          x += 1;
          wrap();
        }
        if (y < height) {
          if (bits.unsigned(1) === 0) {
            zeros = bits.unsigned(this.runBits0);
            ones = bits.unsigned(this.runBits1);
          }
          x += zeros;
          wrap();
        }
      }
    }
    return {width, height, offsetX, offsetY, advance, pixels};
  }

  /** How far a line of `text` moves the pen. */
  advance(text: string): number {
    return Array.from(text).reduce(
      // Array.from gives whole characters, each with a code point.
      (sum, character) => sum + (this.glyph(character.codePointAt(0) as number)?.advance ?? 0),
      0,
    );
  }

  /** For a proportional font, what a line takes is its advance. */
  inkWidth(text: string): number {
    return this.advance(text);
  }

  /**
   * How far a line reaches above its baseline and below it, in pixels: the
   * font's own rise and fall, or more where one of its letters or digits
   * goes further.
   */
  extent(): FontExtent {
    let up = this.ascent;
    let down = Math.max(-this.descent, 0);
    for (let code = 0x30; code <= 0x7a; code += 1) {
      const alphanumeric = code <= 0x39 || (code >= 0x41 && code <= 0x5a) || code >= 0x61;
      const glyph = alphanumeric ? this.glyph(code) : undefined;
      if (glyph && glyph.width > 0 && glyph.height > 0) {
        up = Math.max(up, glyph.height + glyph.offsetY);
        down = Math.max(down, -glyph.offsetY);
      }
    }
    return {up, down};
  }

  /** Draws `text` from the pen at (x, baseline). */
  draw(surface: Surface, text: string, x: number, baseline: number, color: Color): void {
    let pen = x;
    Array.from(text).forEach((character) => {
      const glyph = this.glyph(character.codePointAt(0) as number);
      if (glyph) {
        const left = pen + glyph.offsetX;
        const top = baseline - (glyph.height + glyph.offsetY);
        glyph.pixels.forEach(([px, py]) => surface.set(left + px, top + py, color));
        pen += glyph.advance;
      }
    });
  }
}
