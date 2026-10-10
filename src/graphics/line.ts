// One-pixel lines and polylines, by Bresenham's algorithm stepped along the
// longer axis, as embedded-graphics draws them.

import type {Color} from '../color';
import type Surface from './surface';

/** A pixel's place, [x, y]. */
export type Point = [number, number];

/** The pixels of the line from `start` to `end`, both [x, y], in order. */
export function linePoints([x0, y0]: Point, [x1, y1]: Point): Point[] {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const stepX = dx >= 0 ? 1 : -1;
  const stepY = dy >= 0 ? 1 : -1;
  const adx = Math.abs(dx);
  const ady = Math.abs(dy);
  const steep = ady >= adx;
  const major = steep ? ady : adx;
  const minor = steep ? adx : ady;
  const points: Point[] = [];
  let x = x0;
  let y = y0;
  let error = 0;
  for (let i = 0; i <= major; i += 1) {
    if (error > major) {
      if (steep) {
        x += stepX;
      } else {
        y += stepY;
      }
      error -= 2 * major;
    }
    points.push([x, y]);
    if (steep) {
      y += stepY;
    } else {
      x += stepX;
    }
    error += 2 * minor;
  }
  return points;
}

/**
 * The pixels of the line through `vertices`, each joint once. One vertex,
 * or none, is no line.
 */
export function polylinePoints(vertices: readonly Point[]): Point[] {
  const points: Point[] = [];
  for (let i = 0; i + 1 < vertices.length; i += 1) {
    const segment = linePoints(vertices[i], vertices[i + 1]);
    // The first of a later segment is the last of the one before.
    points.push(...(i === 0 ? segment : segment.slice(1)));
  }
  return points;
}

export function drawLine(surface: Surface, start: Point, end: Point, color: Color): void {
  linePoints(start, end).forEach(([x, y]) => surface.set(x, y, color));
}

export function drawPolyline(surface: Surface, vertices: readonly Point[], color: Color): void {
  polylinePoints(vertices).forEach(([x, y]) => surface.set(x, y, color));
}
