// A picture turned, moved or flipped. Each pixel of the result is found by
// asking where in the picture it came from, and taking the pixel nearest
// that place or a blend of the four around it. The result is the size the
// picture was.
import {roundHalfAway} from '../color';
import {channels} from './picture';
import type {Picture} from './picture';

/** How a place between pixels is read: the nearest, or the four around. */
export type SampleFilter = 'nearest' | 'bilinear';

/**
 * What is read beyond the picture's edge: nothing (`clear`), the pixel at
 * the edge (`clamp`), or the picture again from its far side (`wrap`).
 */
export type Edge = 'clear' | 'clamp' | 'wrap';

export interface RotateOptions {
  filter?: SampleFilter;
  /** `clear` unless told: the corners a turn uncovers are left clear. */
  edge?: Edge;
  /** What it turns about, in pixels; the middle unless told. */
  origin?: readonly [number, number];
}

export interface TranslateOptions {
  filter?: SampleFilter;
  /** `clear` unless told; `wrap` brings round what leaves the far side. */
  edge?: Edge;
}

type Place = (x: number, y: number) => readonly [number, number];

// Where a pixel is read from along an axis `size` long, or -1 for nowhere.
function index(at: number, size: number, edge: Edge): number {
  if (at >= 0 && at < size) {
    return at;
  }
  if (edge === 'clamp') {
    return Math.min(Math.max(at, 0), size - 1);
  }
  if (edge === 'wrap') {
    return ((at % size) + size) % size;
  }
  return -1;
}

// A picture of the same size, each pixel read from `place(x, y)` in this
// one. With a clear edge it is RGBA, whatever it was.
function resample(image: Picture, place: Place, filter: SampleFilter, edge: Edge): Picture {
  const {data, width, height} = image;
  const each = channels(image);
  const outEach = edge === 'clear' ? 4 : each;
  const out = new Uint8Array(width * height * outEach);
  // The pixel at whole (px, py), its colour times `weight` and its alpha,
  // added to `sum`.
  const sum = [0, 0, 0, 0];
  const add = (px: number, py: number, weight: number) => {
    const sx = index(px, width, edge);
    const sy = index(py, height, edge);
    if (sx < 0 || sy < 0 || weight === 0) {
      return;
    }
    const from = (sy * width + sx) * each;
    const alpha = (each === 4 ? data[from + 3] : 255) * weight;
    sum[0] += data[from] * alpha;
    sum[1] += data[from + 1] * alpha;
    sum[2] += data[from + 2] * alpha;
    sum[3] += alpha;
  };
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const [sx, sy] = place(x, y);
      sum.fill(0);
      if (filter === 'nearest') {
        add(roundHalfAway(sx), roundHalfAway(sy), 1);
      } else {
        const [x0, y0] = [Math.floor(sx), Math.floor(sy)];
        const [fx, fy] = [sx - x0, sy - y0];
        add(x0, y0, (1 - fx) * (1 - fy));
        add(x0 + 1, y0, fx * (1 - fy));
        add(x0, y0 + 1, (1 - fx) * fy);
        add(x0 + 1, y0 + 1, fx * fy);
      }
      const to = (y * width + x) * outEach;
      if (sum[3] > 0) {
        out[to] = Math.round(sum[0] / sum[3]);
        out[to + 1] = Math.round(sum[1] / sum[3]);
        out[to + 2] = Math.round(sum[2] / sum[3]);
      }
      if (outEach === 4) {
        out[to + 3] = Math.round(sum[3]);
      }
    }
  }
  return {data: out, width, height};
}

// The sine and cosine of an angle in degrees, exact at the quarter turns.
function turn(degrees: number): readonly [number, number] {
  const within = ((degrees % 360) + 360) % 360;
  if (within % 90 === 0) {
    return [[0, 1, 0, -1][within / 90], [1, 0, -1, 0][within / 90]];
  }
  const radians = (within * Math.PI) / 180;
  return [Math.sin(radians), Math.cos(radians)];
}

/**
 * The picture turned `degrees` clockwise about its middle, at the size it
 * was. What the turn uncovers is clear, so the result is RGBA, unless
 * `edge` says to fill it from the picture. Quarter turns of a square
 * picture move every pixel whole.
 */
export function rotate(
  image: Picture,
  degrees: number,
  {filter = 'nearest', edge = 'clear', origin = undefined}: RotateOptions = {},
): Picture {
  const [sin, cos] = turn(degrees);
  const [midX, midY] = origin ?? [(image.width - 1) / 2, (image.height - 1) / 2];
  // Each pixel is read from where it was before the turn: the same turn
  // the other way about the middle.
  const place: Place = (x, y) => {
    const [dx, dy] = [x - midX, y - midY];
    return [midX + dx * cos + dy * sin, midY - dx * sin + dy * cos];
  };
  return resample(image, place, filter, edge);
}

/**
 * The picture moved `dx` to the right and `dy` down, by parts of a pixel
 * if they are not whole, at the size it was. What it leaves behind is
 * clear, and the result RGBA, unless `edge` says otherwise: `wrap` brings
 * what leaves one side in at the other, for a picture that scrolls round.
 */
export function translate(
  image: Picture,
  dx: number,
  dy: number,
  {filter = 'bilinear', edge = 'clear'}: TranslateOptions = {},
): Picture {
  return resample(image, (x, y) => [x - dx, y - dy], filter, edge);
}

/** The picture mirrored: left for right (`horizontal`) or top for bottom. */
export function flip(image: Picture, direction: 'horizontal' | 'vertical'): Picture {
  const {data, width, height} = image;
  const each = channels(image);
  const out = new Uint8Array(data.length);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const sx = direction === 'horizontal' ? width - 1 - x : x;
      const sy = direction === 'vertical' ? height - 1 - y : y;
      const from = (sy * width + sx) * each;
      out.set(data.subarray(from, from + each), (y * width + x) * each);
    }
  }
  return {data: out, width, height};
}
