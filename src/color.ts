// Colours with alpha. A colour is { r, g, b, a }, each 0..255; the canvas
// blends a pixel over what is already there by its alpha.

/** A colour: red, green, blue and alpha, each 0..255. */
export interface Color {
  r: number;
  g: number;
  b: number;
  a: number;
}

/** A colour without its alpha: what a canvas keeps of a pixel. */
export type Rgb = Pick<Color, 'r' | 'g' | 'b'>;

/** A colour as a prop takes it: "#rrggbb", "#rrggbbaa", or { r, g, b, a }. */
export type ColorLike = string | Color;

const HEX = /^#([0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;

/** An opaque colour. */
export function rgb(r: number, g: number, b: number): Color {
  return {r, g, b, a: 255};
}

export function rgba(r: number, g: number, b: number, a: number): Color {
  return {r, g, b, a};
}

export const BLACK = Object.freeze(rgb(0, 0, 0));
export const WHITE = Object.freeze(rgb(255, 255, 255));

/** Parses "#rrggbb" or "#rrggbbaa". */
export function parseColor(text: string): Color {
  if (typeof text !== 'string' || !HEX.test(text)) {
    throw new Error(`${JSON.stringify(text)}: a colour is #rrggbb or #rrggbbaa`);
  }
  const byte = (at: number) => parseInt(text.slice(at, at + 2), 16);
  return {r: byte(1), g: byte(3), b: byte(5), a: text.length === 9 ? byte(7) : 255};
}

/** A colour from a prop: an object as it is, a string parsed, nothing as nothing. */
export function toColor(value: ColorLike): Color;
export function toColor(value: ColorLike | null | undefined): Color | undefined;
export function toColor(value: ColorLike | null | undefined): Color | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }
  return typeof value === 'string' ? parseColor(value) : value;
}

/** "#rrggbb", or "#rrggbbaa" when the colour is not opaque. */
export function formatColor({r, g, b, a}: Color): string {
  const hex = (v: number) => v.toString(16).padStart(2, '0');
  return `#${hex(r)}${hex(g)}${hex(b)}${a === 255 ? '' : hex(a)}`;
}

/** Rounds half away from zero, as Rust's `round` does. */
export function roundHalfAway(value: number): number {
  return Math.sign(value) * Math.round(Math.abs(value));
}

/**
 * The same colour at `alpha` (0..1) times its own alpha. The arithmetic is
 * in single precision, so the result is the same on every platform.
 */
export function scaleAlpha(color: Color, alpha: number): Color {
  const clamped = Math.min(Math.max(Math.fround(alpha), 0), 1);
  return {...color, a: Math.round(Math.fround(color.a * clamped))};
}

/** The colour `at` of the way from `from` (0) to `to` (1), alpha included. */
export function mix(from: Color, to: Color, at: number): Color {
  const t = Math.fround(at);
  const channel = (a: number, b: number) =>
    roundHalfAway(Math.fround(a + Math.fround((b - a) * t)));
  return {
    r: channel(from.r, to.r),
    g: channel(from.g, to.g),
    b: channel(from.b, to.b),
    a: channel(from.a, to.a),
  };
}
