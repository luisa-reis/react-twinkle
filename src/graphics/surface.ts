// What the drawing functions draw on: a canvas seen through an offset and a
// clip rectangle. A Box makes one for its children, so they draw in their
// own coordinates and nothing spills out of it.

import type Canvas from '../canvas';
import type {Color} from '../color';

/** A rectangle of the canvas, its far edges exclusive. */
export interface Clip {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

export default class Surface {
  canvas: Canvas;

  dx: number;

  dy: number;

  clip: Clip;

  /**
   * @param canvas the canvas underneath
   * @param dx, dy where this surface's origin is on the canvas
   * @param clip the canvas rectangle drawing is kept to, { x0, y0, x1, y1 },
   *   the far edges exclusive
   */
  constructor(canvas: Canvas, dx = 0, dy = 0, clip: Clip | undefined = undefined) {
    this.canvas = canvas;
    this.dx = dx;
    this.dy = dy;
    this.clip = clip ?? {x0: 0, y0: 0, x1: canvas.width, y1: canvas.height};
  }

  /** Blends one pixel, in this surface's coordinates. */
  set(x: number, y: number, color: Color): void {
    const cx = x + this.dx;
    const cy = y + this.dy;
    const {x0, y0, x1, y1} = this.clip;
    if (cx >= x0 && cy >= y0 && cx < x1 && cy < y1) {
      this.canvas.set(cx, cy, color);
    }
  }

  /** The surface of a box at (x, y) here; clipped to its size when asked. */
  child(x: number, y: number, width: number, height: number, clipped: boolean): Surface {
    const dx = this.dx + x;
    const dy = this.dy + y;
    if (!clipped) {
      return new Surface(this.canvas, dx, dy, this.clip);
    }
    const clip = {
      x0: Math.max(this.clip.x0, dx),
      y0: Math.max(this.clip.y0, dy),
      x1: Math.min(this.clip.x1, dx + width),
      y1: Math.min(this.clip.y1, dy + height),
    };
    return new Surface(this.canvas, dx, dy, clip);
  }
}
