# Pictures

Decoding picture files, scaling, rotating, translating and
gamma-correcting them, and the `usePicture` hook.

A picture is `{ data, width, height }`: bytes row by row, three a pixel
(RGB) or four (RGBA). `Image` draws one, blending any alpha it has over
what is under it. Every function here makes a new picture from another
and keeps its alpha; nothing is flattened before it is drawn.

![A flag turned, slid, contained and scaled up](screenshots/pictures.png)

```tsx
import fs from 'node:fs';
import {Image, usePicture} from 'react-twinkle';

const bytes = fs.readFileSync('cover.jpg'); // once, not every frame

function Cover() {
  const cover = usePicture(bytes, {width: 32, height: 32, gamma: 2.2});
  return cover ? <Image {...cover} /> : null;
}
```

| Function                                    | Gives                                                                                                              |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `decodeImage(bytes)`                        | the picture in a JPEG, PNG or GIF file: RGBA if any pixel is not opaque, RGB otherwise                             |
| `decodeFrames(bytes)`                       | every picture of an animated GIF, as `{ picture, delayMs }`; one for any other file                                |
| `scale(picture, width, height, options)`    | it at that size. `fit`: `fill` (crop evenly, the default), `contain` (the rest left clear) or `stretch`            |
| `resize(picture, width, height, filter)`    | it at exactly that size, its shape changed. `filter`: `lanczos` (the default, for photographs) or `nearest`        |
| `rotate(picture, degrees, options)`         | it turned clockwise about its middle (or `origin`), at the size it was                                             |
| `translate(picture, dx, dy, options)`       | it moved right and down, by parts of a pixel if they are not whole                                                 |
| `flip(picture, 'horizontal' \| 'vertical')` | it mirrored                                                                                                        |
| `crop(picture, x, y, width, height)`        | a rectangle of it                                                                                                  |
| `gamma(picture, 2.2)`                       | it with its levels corrected for LEDs, the alpha left alone                                                        |
| `toRgb`, `toRgba`, `isOpaque`, `channels`   | it without or with an alpha, whether it needs one, and how many bytes a pixel it has                               |
| `usePicture(source, options)`               | bytes decoded (or a picture as it is), scaled and gamma-corrected as asked, and remembered until something changes |

`rotate` and `translate` read each pixel from where it came from:
`filter` is `nearest` (the default for a turn; pixel art stays crisp) or
`bilinear` (the default for a move; a blend of the four pixels around).
`edge` says what is read beyond the picture: `clear` (the default, so the
result is RGBA), `clamp` (the pixel at the edge) or `wrap` (the picture
again from its far side, for one that scrolls round). Quarter turns of a
square picture move every pixel whole.

These are functions of a picture, not props of `Image`: decode and scale
once (`usePicture`, or outside the component), and turn or move the
result each frame if it is animated. The arithmetic is JavaScript's own
numbers. Decoding uses [jpeg-js](https://github.com/jpeg-js/jpeg-js),
[pngjs](https://github.com/pngjs/pngjs) and
[omggif](https://github.com/deanm/omggif).

---

[Documentation index](README.md) · [Project README](../README.md)
