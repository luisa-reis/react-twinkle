// The fonts the dashboard draws with: X11 "misc-fixed" bitmaps, public
// domain, as the embedded-graphics crate keeps them. Each is named by its
// character size and given the row its baseline is on.
export const FONTS = {
  '4x6': 4,
  '5x7': 5,
  '6x10': 7,
  '9x15': 11,
  '10x20': 15,
} as const;

export type FontName = keyof typeof FONTS;
