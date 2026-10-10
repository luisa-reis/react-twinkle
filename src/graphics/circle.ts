// Circles by diameter, from their top-left corner, as embedded-graphics
// draws them: a pixel is inside when its centre is within the circle, with
// the small diameters nudged so they look round.

import type {Color} from '../color';
import type {Point} from './line';
import type {ShapeStyle} from './rect';
import type Surface from './surface';

/** A circle: the top-left corner of the square around it, and its diameter. */
export interface CircleGeometry {
  x: number;
  y: number;
  diameter: number;
}

interface Scanline {
  y: number;
  start: number;
  end: number;
  fillStart: number;
  fillEnd: number;
}

function threshold(diameter: number): number {
  return diameter <= 4 ? diameter * diameter - Math.floor(diameter / 2) : diameter * diameter;
}

// The circle `offset` pixels larger (or, negative, smaller) all round.
function offsetCircle({x, y, diameter}: CircleGeometry, offset: number): CircleGeometry {
  const grown = Math.max(0, diameter + 2 * offset);
  const centre = Math.floor(Math.max(0, diameter - 1) / 2);
  const corner = Math.floor(Math.max(0, grown - 1) / 2);
  return {x: x + centre - corner, y: y + centre - corner, diameter: grown};
}

// Each row of the circle as { y, start, end }, `end` exclusive, with the
// part of it inside `fillThreshold` as fillStart..fillEnd.
function scanlines(circle: CircleGeometry, fillThreshold: number): Scanline[] {
  const {x, y, diameter} = circle;
  const limit = threshold(diameter);
  const reach = Math.max(0, diameter - 1);
  const cx2 = 2 * x + reach;
  const cy2 = 2 * y + reach;
  const distance = (col: number, row: number) => (2 * col - cx2) ** 2 + (2 * row - cy2) ** 2;
  const lines: Scanline[] = [];
  for (let row = y; row < y + diameter; row += 1) {
    let start = x;
    while (start < x + diameter && distance(start, row) >= limit) {
      start += 1;
    }
    if (start < x + diameter) {
      const end = x + diameter - (start - x);
      let fillStart = start;
      while (fillStart < end && distance(fillStart, row) >= fillThreshold) {
        fillStart += 1;
      }
      const filled = fillStart < end;
      lines.push({
        y: row,
        start,
        end,
        fillStart: filled ? fillStart : end,
        fillEnd: filled ? end - (fillStart - start) : end,
      });
    }
  }
  return lines;
}

function styled(circle: CircleGeometry, strokeWidth: number): Scanline[] {
  const outside = Math.floor(strokeWidth / 2);
  const inside = Math.floor((strokeWidth + 1) / 2);
  return scanlines(
    offsetCircle(circle, outside),
    threshold(offsetCircle(circle, -inside).diameter),
  );
}

/**
 * The pixels of a circle's stroke as [x, y] pairs, row by row, each row's
 * left part before its right: the order they are drawn in.
 */
export function circleOutline(circle: CircleGeometry, strokeWidth = 1): Point[] {
  const points: Point[] = [];
  styled(circle, strokeWidth).forEach((line) => {
    for (let col = line.start; col < line.fillStart; col += 1) {
      points.push([col, line.y]);
    }
    for (let col = line.fillEnd; col < line.end; col += 1) {
      points.push([col, line.y]);
    }
  });
  return points;
}

/** A circle with an optional fill and an optional stroke centred on its edge. */
export function drawCircle(
  surface: Surface,
  circle: CircleGeometry,
  {fill, stroke, strokeWidth = 1}: ShapeStyle = {},
): void {
  const drawn = stroke && strokeWidth > 0;
  const span = (row: number, from: number, to: number, color: Color) => {
    for (let col = from; col < to; col += 1) {
      surface.set(col, row, color);
    }
  };
  if (!drawn) {
    if (fill) {
      scanlines(circle, 0).forEach((line) => span(line.y, line.start, line.end, fill));
    }
    return;
  }
  styled(circle, strokeWidth).forEach((line) => {
    span(line.y, line.start, line.fillStart, stroke);
    if (fill) {
      span(line.y, line.fillStart, line.fillEnd, fill);
    }
    span(line.y, line.fillEnd, line.end, stroke);
  });
}
