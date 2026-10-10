// The fonts an application has registered, by name. react-twinkle reads
// two formats (fixed-width bitmaps as embedded-graphics keeps them, and
// U8g2's compressed fonts) but has no fonts of its own: fonts are other
// people's work under their own terms, so the application brings the ones
// it wants and registers them before it draws.
import type {Color} from '../color';
import type Surface from '../graphics/surface';
import MonoFont from './mono';
import type {MonoFontDescription} from './mono';
import U8g2Font from './u8g2';

/** How far a line reaches above its baseline and below it, in pixels. */
export interface FontExtent {
  up: number;
  down: number;
}

/** What `registerFont` takes: anything that measures a line and draws it. */
export interface Font {
  /**
   * 'mono' for a fixed-width font, which is aligned by its ink and has a
   * `baseline`; any other kind is aligned by its advance and has an `ascent`.
   */
  kind: string;
  /** What the font is called. */
  name?: string;
  /** For a 'mono' font: the row the baseline is on, from a character's top. */
  baseline?: number;
  /** For any other: how far the font rises above the baseline. */
  ascent?: number;
  /** How far a line of `text` moves the pen. */
  advance(text: string): number;
  /** How wide the pixels `text` lights are. */
  inkWidth(text: string): number;
  /** How far a line reaches above its baseline and below it. */
  extent(): FontExtent;
  /** Draws `text` from (x, y): a 'mono' font's top-left corner, another's pen on the baseline. */
  draw(surface: Surface, text: string, x: number, y: number, color: Color): void;
}

/**
 * The name that stands for the default font: the one `setDefaultFont`
 * named, or the first registered.
 */
export const DEFAULT_FONT = 'default';

const fonts = new Map<string, Font>();
let fallback: string | undefined;

/**
 * Registers a font under `name`: anything with `kind`, `advance(text)`,
 * `inkWidth(text)`, `extent()` and `draw(surface, text, x, y, color)`.
 * Registering a name again replaces the font.
 */
export function registerFont<F extends Font>(name: string, font: F): F {
  if (name === DEFAULT_FONT) {
    throw new Error(`"${DEFAULT_FONT}" stands for the default font: register under another name`);
  }
  fonts.set(name, font);
  return font;
}

/**
 * Registers a fixed-width font from its glyph image:
 * `{ width, height, baseline, data, glyphsPerRow }`, `data` the image's
 * bytes, one bit a pixel, its rows padded to whole bytes.
 */
export function registerMonoFont(name: string, description: MonoFontDescription): MonoFont {
  return registerFont(name, new MonoFont(name, description));
}

/** Registers a U8g2 font from the bytes of its data, a Uint8Array. */
export function registerU8g2Font(name: string, bytes: Uint8Array): U8g2Font {
  return registerFont(name, new U8g2Font(name, bytes));
}

/** Makes the font called `name` the one drawn when none is named. */
export function setDefaultFont(name: string): void {
  if (!fonts.has(name)) {
    throw new Error(`no font named ${name} is registered`);
  }
  fallback = name;
}

/** Forgets every font, and which was the default. */
export function clearFonts(): void {
  fonts.clear();
  fallback = undefined;
}

/** The names of the registered fonts, in the order they were registered. */
export function fontNames(): string[] {
  return [...fonts.keys()];
}

/**
 * The font called `name`, or the default one. An unknown name is an error
 * that lists the known ones.
 */
export function getFont(name: string = DEFAULT_FONT): Font {
  if (name === DEFAULT_FONT) {
    const first = fallback ?? fonts.keys().next().value;
    if (first === undefined) {
      throw new Error(
        'no font is registered: register one with registerMonoFont or registerU8g2Font before drawing text',
      );
    }
    // The default is the name of a registered font, or the first of them.
    return fonts.get(first) as Font;
  }
  const font = fonts.get(name);
  if (!font) {
    throw new Error(`no font named ${name} (registered: ${fontNames().join(', ') || 'none'})`);
  }
  return font;
}

/** How wide `text` is in the font called `name`, in pixels of ink. */
export function measureText(text: string, name: string = DEFAULT_FONT): number {
  return getFont(name).inkWidth(text);
}
