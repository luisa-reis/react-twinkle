// Pictures from the bytes of a file: JPEG, PNG and GIF. A picture that has
// any pixel that is not opaque comes back RGBA, any other RGB.
import jpeg from 'jpeg-js';
import {GifReader} from 'omggif';
import {PNG} from 'pngjs';
import {isOpaque, toRgb} from './picture';
import type {Picture} from './picture';

/** One picture of an animation, and how long it is shown. */
export interface PictureFrame {
  picture: Picture;
  /** Milliseconds, as the file says; 0 when it does not. */
  delayMs: number;
}

/** What a file of pictures is, told from its first bytes. */
export type PictureFormat = 'jpeg' | 'png' | 'gif';

/** The format the bytes start as, or undefined if it is not one known. */
export function pictureFormat(bytes: Uint8Array): PictureFormat | undefined {
  if (bytes[0] === 0xff && bytes[1] === 0xd8) {
    return 'jpeg';
  }
  if (bytes[0] === 0x89 && bytes[1] === 0x50) {
    return 'png';
  }
  if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) {
    return 'gif';
  }
  return undefined;
}

// Four bytes a pixel as they were decoded, down to three if all are opaque.
function tidy(data: Uint8Array, width: number, height: number): Picture {
  const picture = {data: Uint8Array.from(data), width, height};
  return isOpaque(picture) ? toRgb(picture) : picture;
}

// A GIF's frames, each laid over what the ones before left, as the file
// says to leave it: `count` of them at most.
function gifFrames(bytes: Uint8Array, count: number): PictureFrame[] {
  const reader = new GifReader(bytes);
  const {width, height} = reader;
  const shown = new Uint8Array(width * height * 4);
  const frames: PictureFrame[] = [];
  const clear = (x: number, y: number, w: number, h: number) => {
    for (let row = y; row < y + h; row += 1) {
      shown.fill(0, (row * width + x) * 4, (row * width + x + w) * 4);
    }
  };
  for (let i = 0; i < Math.min(reader.numFrames(), count); i += 1) {
    const info = reader.frameInfo(i);
    // Disposal 3 puts back what was there before the frame was drawn.
    const before = info.disposal === 3 ? Uint8Array.from(shown) : undefined;
    reader.decodeAndBlitFrameRGBA(i, shown);
    frames.push({picture: tidy(shown, width, height), delayMs: info.delay * 10});
    if (before) {
      shown.set(before);
    } else if (info.disposal === 2) {
      clear(info.x, info.y, info.width, info.height);
    }
  }
  return frames;
}

function decoded<T>(decode: () => T): T {
  try {
    return decode();
  } catch (error) {
    throw new Error(`decoding picture: ${(error as Error).message}`);
  }
}

/**
 * A JPEG's, a PNG's or a GIF's pixels, { data, width, height }: RGBA if
 * any of it is not opaque, RGB otherwise. Of an animated GIF, the first
 * picture.
 */
export function decodeImage(bytes: Uint8Array): Picture {
  switch (pictureFormat(bytes)) {
    case 'jpeg':
      return decoded(() => {
        const {data, width, height} = jpeg.decode(bytes, {
          useTArray: true,
          maxMemoryUsageInMB: 2048,
        });
        return toRgb({data, width, height});
      });
    case 'png':
      return decoded(() => {
        const {data, width, height} = PNG.sync.read(Buffer.from(bytes));
        return tidy(data, width, height);
      });
    case 'gif':
      return decoded(() => {
        const [first] = gifFrames(bytes, 1);
        if (!first) {
          throw new Error('a GIF with no pictures');
        }
        return first.picture;
      });
    default:
      throw new Error('decoding picture: not a JPEG, a PNG or a GIF');
  }
}

/**
 * Every picture of a file, with how long each is shown: all the frames of
 * an animated GIF, and the one picture of anything else.
 */
export function decodeFrames(bytes: Uint8Array): PictureFrame[] {
  if (pictureFormat(bytes) === 'gif') {
    return decoded(() => gifFrames(bytes, Infinity));
  }
  return [{picture: decodeImage(bytes), delayMs: 0}];
}
