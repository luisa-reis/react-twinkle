// Pictures written as rows of letters, for the tests of what is done to
// them.
import {channels} from '../../src';
import type {Picture} from '../../src';

// A picture from rows of letters: `r`, `g`, `b`, `w`, `k` (black), and
// `.` for a clear pixel, which makes it RGBA.
const INK: Record<string, number[]> = {
  r: [255, 0, 0, 255],
  g: [0, 255, 0, 255],
  b: [0, 0, 255, 255],
  w: [255, 255, 255, 255],
  k: [0, 0, 0, 255],
  '.': [0, 0, 0, 0],
};

export function picture(...rows: string[]): Picture {
  const clear = rows.some((row) => row.includes('.'));
  const data = rows.flatMap((row) =>
    [...row].flatMap((letter) => (clear ? INK[letter] : INK[letter].slice(0, 3))),
  );
  return {data: Uint8Array.from(data), width: rows[0].length, height: rows.length};
}

// A picture back as rows of letters; `?` for a pixel that is none of them.
export function letters(image: Picture): string[] {
  const each = channels(image);
  return Array.from({length: image.height}, (unusedRow, y) =>
    Array.from({length: image.width}, (unusedPixel, x) => {
      const at = (y * image.width + x) * each;
      const pixel = [...image.data.subarray(at, at + 3), each === 4 ? image.data[at + 3] : 255];
      if (pixel[3] === 0) {
        return '.';
      }
      const found = Object.keys(INK).find((letter) => INK[letter].join() === pixel.join());
      return found ?? '?';
    }).join(''),
  );
}
