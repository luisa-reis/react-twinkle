// Fixed-width bitmap fonts in the form embedded-graphics keeps its own: an
// image of the glyphs, so many to a row, one bit a pixel, each row of the
// image padded to whole bytes. The glyphs are ASCII and then Latin-1's
// upper half. The library has none of its own: the application registers
// those it draws with.

import type {Color} from '../color';
import type Surface from '../graphics/surface';
import type {Font, FontExtent} from './index';

/** A fixed-width font as `registerMonoFont` takes it. */
export interface MonoFontDescription {
  /** A character's width and height in pixels. */
  width: number;
  height: number;
  /** The row the baseline is on, counted from the top of a character. */
  baseline: number;
  /** The glyph image's bytes, one bit a pixel, its rows padded to whole bytes. */
  data: Uint8Array;
  /** How many glyphs a row of the image holds; sixteen unless said. */
  glyphsPerRow?: number;
}

// A string of one character always has a code point.
const UNKNOWN = ('?'.codePointAt(0) as number) - 0x20;

// Where a character's glyph is in the image: ASCII, then Latin-1's upper
// half; anything else is drawn as a question mark.
function glyphIndex(codePoint: number): number {
  if (codePoint >= 0x20 && codePoint <= 0x7f) {
    return codePoint - 0x20;
  }
  if (codePoint >= 0xa0 && codePoint <= 0xff) {
    return codePoint - 0xa0 + 96;
  }
  return UNKNOWN;
}

export default class MonoFont implements Font {
  kind: 'mono';

  name: string;

  width: number;

  height: number;

  baseline: number;

  glyphsPerRow: number;

  bytesPerRow: number;

  bits: Uint8Array;

  /**
   * @param name what the font is called
   * @param width, height a character's size in pixels
   * @param baseline the row the baseline is on, from a character's top
   * @param data the image's bytes
   * @param glyphsPerRow how many glyphs a row of the image holds
   */
  constructor(
    name: string,
    {width, height, baseline, data, glyphsPerRow = 16}: MonoFontDescription,
  ) {
    this.kind = 'mono';
    this.name = name;
    /** A character's width and height in pixels. */
    this.width = width;
    this.height = height;
    /** The row the baseline is on, counted from the top of a character. */
    this.baseline = baseline;
    this.glyphsPerRow = glyphsPerRow;
    this.bytesPerRow = Math.ceil((glyphsPerRow * width) / 8);
    this.bits = data;
  }

  /** How far a line of `text` moves the pen: its characters' widths. */
  advance(text: string): number {
    return Array.from(text).length * this.width;
  }

  /**
   * The pixels `text` lights, in pixels: one less than its advance, the
   * last character's blank column left off; nothing for no text.
   */
  inkWidth(text: string): number {
    return this.advance(text) - 1;
  }

  /** How far a line reaches above its baseline and below it. */
  extent(): FontExtent {
    return {up: this.baseline, down: this.height - this.baseline};
  }

  /** Draws `text` with its top-left corner at (x, top). */
  draw(surface: Surface, text: string, x: number, top: number, color: Color): void {
    Array.from(text).forEach((character, position) => {
      // Array.from gives whole characters, each with a code point.
      const index = glyphIndex(character.codePointAt(0) as number);
      const imageX = (index % this.glyphsPerRow) * this.width;
      const imageY = Math.floor(index / this.glyphsPerRow) * this.height;
      for (let row = 0; row < this.height; row += 1) {
        for (let col = 0; col < this.width; col += 1) {
          const bit = imageX + col;
          const byte = this.bits[(imageY + row) * this.bytesPerRow + (bit >> 3)];
          if (byte & (0x80 >> (bit & 7))) {
            surface.set(x + position * this.width + col, top + row, color);
          }
        }
      }
    });
  }
}
