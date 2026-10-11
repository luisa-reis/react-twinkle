# Outputs

Where frames go: a WLED panel over DDP, a PNG, an animated PNG, or
anything of your own.

- `new DdpOutput('host[:port]')` sends frames to WLED as DDP (UDP 4048).
- `encodePng(picture)` and `encodeApng(pictures, fps)` make a PNG or an
  animated one from `{ data, width, height }`, RGB or RGBA;
  `scaleUp(picture, 4)` enlarges one first.
- Anything with `send(rgb)` is an output.

Without `render`, draw frames yourself:

```tsx
import fs from 'node:fs';
import {createRoot, encodePng, scaleUp} from 'react-twinkle';

const root = createRoot({width: 64, height: 64});
root.render(<App />);
const canvas = root.frame({frame: 0, now: new Date()});
fs.writeFileSync('frame.png', encodePng(scaleUp({data: canvas.px, width: 64, height: 64}, 4)));
```

## `render` and `createRoot`

`render(element, options)` draws frame after frame and sends each to an
output.

| Option            | Is                                                                                                    |
| ----------------- | ----------------------------------------------------------------------------------------------------- |
| `width`, `height` | the panel, in pixels                                                                                  |
| `fps`             | frames a second; ten unless said                                                                      |
| `background`      | what the canvas is cleared to before each frame; black unless said                                    |
| `output`          | where frames go; its `close()` is called at the end when it has one                                   |
| `frames`          | stop after this many; otherwise it runs until `unmount()`                                             |
| `onFrame`         | called with `(canvas, frame)` after each is drawn; returning `false` keeps that frame from being sent |

It gives back `{ canvas, rerender(element), unmount(), waitUntilExit() }`.

`createRoot({ width, height, fps, background, onExit })` gives a root
that draws only when `frame()` is called, as in the example above: what
previews and tests use. `root.frame({ frame, now })` draws that frame for
that time; left out, they are the next frame and the present.

---

[Documentation index](README.md) · [Project README](../README.md)
