// Gamma: a panel's LEDs are brighter in their low levels than a screen's
// pixels, and a picture shown as it is looks washed out.
import {channels} from './picture';
import type {Picture} from './picture';

/**
 * The picture with each colour level v (0..1) raised to `value`: more than
 * 1 darkens the middle levels, as LEDs want (2.2 is usual). The alpha is
 * left as it is.
 */
export default function gamma(image: Picture, value: number): Picture {
  const each = channels(image);
  const levels = Uint8Array.from({length: 256}, (unused, v) =>
    Math.round((v / 255) ** value * 255),
  );
  const data = Uint8Array.from(image.data, (v, i) => (i % each === 3 ? v : levels[v]));
  return {data, width: image.width, height: image.height};
}
