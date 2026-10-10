// Rectangles: filled, and outlined with a stroke centred on the edge, the
// way embedded-graphics draws them.

import type {Color} from '../color';
import type Surface from './surface';

/** A rectangle: its top-left corner and its size, in pixels. */
export interface RectGeometry {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** What a shape is drawn with: a fill, a stroke, both or neither. */
export interface ShapeStyle {
  fill?: Color;
  stroke?: Color;
  strokeWidth?: number;
}

/** Fills `width` by `height` pixels from (x, y). */
export function fillRect(
  surface: Surface,
  x: number,
  y: number,
  width: number,
  height: number,
  color: Color,
): void {
  for (let row = 0; row < height; row += 1) {
    for (let col = 0; col < width; col += 1) {
      surface.set(x + col, y + row, color);
    }
  }
}

// A rectangle grown (or, negative, shrunk) by `offset` on every side,
// about its centre.
function offsetRect({x, y, width, height}: RectGeometry, offset: number): RectGeometry {
  const grow = (size: number) => Math.max(0, size + 2 * offset);
  const centre = (at: number, size: number) => at + Math.floor(Math.max(0, size - 1) / 2);
  const corner = (at: number, size: number) =>
    centre(at, size) - Math.floor(Math.max(0, grow(size) - 1) / 2);
  return {x: corner(x, width), y: corner(y, height), width: grow(width), height: grow(height)};
}

/**
 * A rectangle with an optional fill and an optional stroke `strokeWidth`
 * wide, centred on its edge: a one-pixel stroke is the outermost pixels.
 */
export function drawRect(
  surface: Surface,
  rect: RectGeometry,
  {fill, stroke, strokeWidth = 1}: ShapeStyle = {},
): void {
  const drawn = stroke && strokeWidth > 0;
  const outside = drawn ? Math.floor(strokeWidth / 2) : 0;
  const inside = drawn ? Math.floor((strokeWidth + 1) / 2) : 0;
  const inner = offsetRect(rect, -inside);
  if (fill) {
    fillRect(surface, inner.x, inner.y, inner.width, inner.height, fill);
  }
  if (!drawn) {
    return;
  }
  const outer = offsetRect(rect, outside);
  const top = Math.min(strokeWidth, Math.floor(outer.height / 2));
  const bottom = Math.min(strokeWidth, outer.height - top);
  fillRect(surface, outer.x, outer.y, outer.width, top, stroke);
  fillRect(
    surface,
    outer.x,
    outer.y + Math.max(0, outer.height - bottom),
    outer.width,
    bottom,
    stroke,
  );
  if (inner.height > 0) {
    const side = Math.floor(Math.min(strokeWidth * 2, outer.width + 1) / 2);
    fillRect(surface, outer.x, outer.y + top, side, inner.height, stroke);
    fillRect(
      surface,
      outer.x + Math.max(0, outer.width - side),
      outer.y + top,
      side,
      inner.height,
      stroke,
    );
  }
}
