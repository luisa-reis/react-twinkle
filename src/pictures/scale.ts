// A picture at another size. Lanczos resampling (three lobes, rows first
// and then columns, as the Rust `image` crate does it) is for photographs
// brought down to a panel; nearest keeps pixel art as it was drawn.
import {roundHalfAway} from '../color';
import {blank, channels, toRgba} from './picture';
import type {Picture} from './picture';

/** How a pixel of the new size is found from those of the old. */
export type ScaleFilter = 'lanczos' | 'nearest';

/**
 * How a picture is fitted to a size of another shape: `fill` covers it and
 * crops the overhang evenly, `contain` keeps the whole picture and leaves
 * the rest clear, `stretch` changes the shape.
 */
export type Fit = 'fill' | 'contain' | 'stretch';

export interface ScaleOptions {
  fit?: Fit;
  filter?: ScaleFilter;
}

const SUPPORT = 3;

function sinc(t: number): number {
  const a = t * Math.PI;
  return t === 0 ? 1 : Math.sin(a) / a;
}

const lanczos3 = (x: number) => (Math.abs(x) < SUPPORT ? sinc(x) * sinc(x / SUPPORT) : 0);

// For each of `to` output positions along an axis `from` long: the first
// input position that counts and the weight of each from there.
function taps(from: number, to: number): {left: number; weights: number[]}[] {
  const ratio = from / to;
  const spread = Math.max(ratio, 1);
  const support = SUPPORT * spread;
  return Array.from({length: to}, (unused, out) => {
    const centre = (out + 0.5) * ratio;
    const left = Math.min(Math.max(Math.floor(centre - support), 0), from - 1);
    const right = Math.min(Math.max(Math.ceil(centre + support), left + 1), from);
    const weights: number[] = [];
    for (let i = left; i < right; i += 1) {
      weights.push(lanczos3((i - (centre - 0.5)) / spread));
    }
    const sum = weights.reduce((a, b) => a + b, 0);
    return {left, weights: weights.map((weight) => weight / sum)};
  });
}

// The colours of an RGBA picture times their alpha, so that a clear pixel
// lends none of its colour to the ones beside it.
function premultiplied(data: Uint8Array): Float32Array {
  const out = new Float32Array(data.length);
  for (let i = 0; i < data.length; i += 4) {
    const alpha = data[i + 3] / 255;
    out[i] = data[i] * alpha;
    out[i + 1] = data[i + 1] * alpha;
    out[i + 2] = data[i + 2] * alpha;
    out[i + 3] = data[i + 3];
  }
  return out;
}

const byte = (value: number) => Math.round(Math.min(Math.max(value, 0), 255));

function lanczos(image: Picture, width: number, height: number): Picture {
  const each = channels(image);
  const source = each === 4 ? premultiplied(image.data) : image.data;
  const stride = image.width * each;
  const rows = new Float32Array(stride * height);
  taps(image.height, height).forEach(({left, weights}, y) => {
    for (let x = 0; x < stride; x += 1) {
      let sum = 0;
      for (let i = 0; i < weights.length; i += 1) {
        sum += source[(left + i) * stride + x] * weights[i];
      }
      rows[y * stride + x] = sum;
    }
  });
  const data = new Uint8Array(width * height * each);
  const pixel = [0, 0, 0, 0];
  taps(image.width, width).forEach(({left, weights}, x) => {
    for (let y = 0; y < height; y += 1) {
      for (let channel = 0; channel < each; channel += 1) {
        let sum = 0;
        for (let i = 0; i < weights.length; i += 1) {
          sum += rows[(y * image.width + left + i) * each + channel] * weights[i];
        }
        pixel[channel] = sum;
      }
      const to = (y * width + x) * each;
      // The colours of a pixel with alpha are divided by it again.
      const alpha = each === 4 ? Math.min(Math.max(pixel[3], 0), 255) / 255 : 1;
      for (let channel = 0; channel < 3; channel += 1) {
        data[to + channel] = alpha > 0 ? byte(pixel[channel] / alpha) : 0;
      }
      if (each === 4) {
        data[to + 3] = byte(pixel[3]);
      }
    }
  });
  return {data, width, height};
}

function nearest(image: Picture, width: number, height: number): Picture {
  const each = channels(image);
  const data = new Uint8Array(width * height * each);
  for (let y = 0; y < height; y += 1) {
    const sy = Math.min(Math.floor(((y + 0.5) * image.height) / height), image.height - 1);
    for (let x = 0; x < width; x += 1) {
      const sx = Math.min(Math.floor(((x + 0.5) * image.width) / width), image.width - 1);
      const from = (sy * image.width + sx) * each;
      data.set(image.data.subarray(from, from + each), (y * width + x) * each);
    }
  }
  return {data, width, height};
}

/** The picture at exactly `width` by `height`, its shape changed to suit. */
export function resize(
  image: Picture,
  width: number,
  height: number,
  filter: ScaleFilter = 'lanczos',
): Picture {
  if (image.width === width && image.height === height) {
    return image;
  }
  return filter === 'nearest' ? nearest(image, width, height) : lanczos(image, width, height);
}

/** The rectangle of the picture at (x, y), `width` by `height`. */
export function crop(image: Picture, x: number, y: number, width: number, height: number): Picture {
  const each = channels(image);
  const left = Math.min(Math.max(x, 0), image.width);
  const top = Math.min(Math.max(y, 0), image.height);
  const wide = Math.min(width, image.width - left);
  const high = Math.min(height, image.height - top);
  const data = new Uint8Array(wide * high * each);
  for (let row = 0; row < high; row += 1) {
    const from = ((top + row) * image.width + left) * each;
    data.set(image.data.subarray(from, from + wide * each), row * wide * each);
  }
  return {data, width: wide, height: high};
}

// `image` in the middle of a clear picture of `width` by `height`.
function centred(image: Picture, width: number, height: number): Picture {
  const out = blank(width, height);
  const inner = toRgba(image);
  const left = Math.floor((width - image.width) / 2);
  const top = Math.floor((height - image.height) / 2);
  for (let row = 0; row < image.height; row += 1) {
    const from = row * image.width * 4;
    out.data.set(
      inner.data.subarray(from, from + image.width * 4),
      ((top + row) * width + left) * 4,
    );
  }
  return out;
}

/**
 * The picture at `width` by `height`. `fit` says what becomes of a picture
 * of another shape (`fill` unless told), `filter` how its pixels are found
 * (`lanczos` unless told). A picture contained in a size of another shape
 * comes back RGBA, clear where it does not reach.
 */
export function scale(
  image: Picture,
  width: number,
  height: number,
  {fit = 'fill', filter = 'lanczos'}: ScaleOptions = {},
): Picture {
  if (fit === 'stretch') {
    return resize(image, width, height, filter);
  }
  const across = width / image.width;
  const down = height / image.height;
  const ratio = fit === 'fill' ? Math.max(across, down) : Math.min(across, down);
  const wide = Math.max(roundHalfAway(image.width * ratio), 1);
  const high = Math.max(roundHalfAway(image.height * ratio), 1);
  const scaled = resize(image, wide, high, filter);
  if (fit === 'contain') {
    const [w, h] = [Math.min(wide, width), Math.min(high, height)];
    const whole = w === wide && h === high ? scaled : crop(scaled, 0, 0, w, h);
    return w === width && h === height ? whole : centred(whole, width, height);
  }
  const tall = width * high > wide * height;
  const left = tall ? 0 : Math.floor((wide - width) / 2);
  const top = tall ? Math.floor((high - height) / 2) : 0;
  return crop(scaled, left, top, width, height);
}
