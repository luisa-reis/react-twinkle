// PNG and animated PNG (APNG) writers for pictures, RGB or RGBA, with
// nothing but zlib: enough to save a canvas, or a run of them, as a picture.
import zlib from 'node:zlib';
import {channels} from '../pictures/picture';
import type {Picture} from '../pictures/picture';

/**
 * A stored frame of an animation: the rectangle that changed, its bytes
 * (as many a pixel as the pictures have), and how many frames it is shown
 * for.
 */
export interface AnimationPart {
  x: number;
  y: number;
  width: number;
  height: number;
  data: Uint8Array;
  frames: number;
}

const SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

const CRC_TABLE = new Uint32Array(256).map((unused, n) => {
  let c = n;
  for (let k = 0; k < 8; k += 1) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  return c >>> 0;
});

function crc32(bytes: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i += 1) {
    c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Uint8Array): Buffer {
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const out = Buffer.alloc(body.length + 8);
  out.writeUInt32BE(data.length, 0);
  body.copy(out, 4);
  out.writeUInt32BE(crc32(body), body.length + 4);
  return out;
}

function header(width: number, height: number, each: number): Buffer {
  const data = Buffer.alloc(13);
  data.writeUInt32BE(width, 0);
  data.writeUInt32BE(height, 4);
  data[8] = 8; // bits a channel
  data[9] = each === 4 ? 6 : 2; // RGBA or RGB
  return chunk('IHDR', data);
}

// The rows, each after a byte that says it is not filtered, deflated.
function deflate(bytes: Uint8Array, width: number, height: number): Buffer {
  const stride = bytes.length / height;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y += 1) {
    raw.set(bytes.subarray(y * stride, (y + 1) * stride), y * (stride + 1) + 1);
  }
  return zlib.deflateSync(raw, {level: 9});
}

/** A picture scaled up `scale` times, each pixel a square. */
export function scaleUp(picture: Picture, scale: number): Picture {
  const {data, width, height} = picture;
  if (scale === 1) {
    return {data, width, height};
  }
  const each = channels(picture);
  const out = new Uint8Array(width * scale * height * scale * each);
  for (let y = 0; y < height * scale; y += 1) {
    for (let x = 0; x < width * scale; x += 1) {
      const from = (Math.floor(y / scale) * width + Math.floor(x / scale)) * each;
      const to = (y * width * scale + x) * each;
      out.set(data.subarray(from, from + each), to);
    }
  }
  return {data: out, width: width * scale, height: height * scale};
}

/** A PNG of a picture, { data, width, height }, as a Buffer. */
export function encodePng(picture: Picture): Buffer {
  const {data, width, height} = picture;
  return Buffer.concat([
    SIGNATURE,
    header(width, height, channels(picture)),
    chunk('IDAT', deflate(data, width, height)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

/**
 * The frames of an animation as it is stored: each is only the rectangle
 * that differs from the frame before, laid over it, and a frame that does
 * not differ adds to the time of the one before. The first is whole.
 * `frames` is an array, or anything that gives them one at a time.
 */
export function animationParts(frames: Iterable<Picture>): AnimationPart[] {
  const parts: AnimationPart[] = [];
  let shown: Uint8Array | undefined;
  const add = (frame: Picture) => {
    const {data, width, height} = frame;
    const each = channels(frame);
    if (!shown) {
      parts.push({x: 0, y: 0, width, height, data, frames: 1});
      shown = data;
      return;
    }
    let [x0, y0, x1, y1] = [width, height, -1, -1];
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const i = (y * width + x) * each;
        if (
          data[i] !== shown[i] ||
          data[i + 1] !== shown[i + 1] ||
          data[i + 2] !== shown[i + 2] ||
          (each === 4 && data[i + 3] !== shown[i + 3])
        ) {
          x0 = Math.min(x0, x);
          y0 = Math.min(y0, y);
          x1 = Math.max(x1, x);
          y1 = Math.max(y1, y);
        }
      }
    }
    if (x1 < 0) {
      parts[parts.length - 1].frames += 1;
      return;
    }
    // Its bytes are filled in below, once its size is known.
    const part = {
      x: x0,
      y: y0,
      width: x1 - x0 + 1,
      height: y1 - y0 + 1,
      frames: 1,
    } as AnimationPart;
    part.data = new Uint8Array(part.width * part.height * each);
    for (let y = 0; y < part.height; y += 1) {
      const from = ((y0 + y) * width + x0) * each;
      part.data.set(data.subarray(from, from + part.width * each), y * part.width * each);
    }
    parts.push(part);
    shown = data;
  };
  // Anything that can be iterated, taken one at a time: a long animation
  // need not have all its frames in memory at once.
  const iterator = frames[Symbol.iterator]();
  for (let step = iterator.next(); !step.done; step = iterator.next()) {
    add(step.value);
  }
  return parts;
}

/**
 * An animated PNG of pictures of one size, all RGB or all RGBA, `fps` of
 * them a second, looping: an array of them, or anything that gives them one at a time.
 * A viewer that does not know APNG shows the first.
 */
export function encodeApng(frames: Iterable<Picture>, fps: number): Buffer {
  const parts = animationParts(frames);
  const [{width, height, data}] = parts;
  const control = Buffer.alloc(8);
  control.writeUInt32BE(parts.length, 0);
  const each = data.length / (width * height);
  const out = [SIGNATURE, header(width, height, each), chunk('acTL', control)];
  let sequence = 0;
  parts.forEach((part, index) => {
    const frame = Buffer.alloc(26);
    frame.writeUInt32BE(sequence, 0);
    frame.writeUInt32BE(part.width, 4);
    frame.writeUInt32BE(part.height, 8);
    frame.writeUInt32BE(part.x, 12);
    frame.writeUInt32BE(part.y, 16);
    frame.writeUInt16BE(Math.min(part.frames, 0xffff), 20);
    frame.writeUInt16BE(Math.min(Math.max(fps, 1), 0xffff), 22);
    out.push(chunk('fcTL', frame));
    sequence += 1;
    const pixels = deflate(part.data, part.width, part.height);
    if (index === 0) {
      out.push(chunk('IDAT', pixels));
    } else {
      const numbered = Buffer.alloc(pixels.length + 4);
      numbered.writeUInt32BE(sequence, 0);
      pixels.copy(numbered, 4);
      out.push(chunk('fdAT', numbered));
      sequence += 1;
    }
  });
  out.push(chunk('IEND', Buffer.alloc(0)));
  return Buffer.concat(out);
}
