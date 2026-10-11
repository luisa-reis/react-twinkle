# How it works

It is Ink's design with another surface:

```
  <App />                 your components, hooks, state
     │  react-reconciler
     ▼
  node tree               twinkle-box, twinkle-text, twinkle-rect, …
     │  paint, once a frame
     ▼
  Canvas                  width × height RGB bytes, alpha blended in
     │  output.send(rgb)
     ▼
  DDP over UDP → WLED     or a PNG, an animated PNG, a test's assertion
```

- **The reconciler** (`src/reconciler.ts`) is a `react-reconciler` host
  config, as Ink's is: React builds and updates a tree of plain nodes.
- **A root** (`createRoot`) owns a tree and a canvas. `root.frame({ frame,
now })` draws one frame: it hands the frame to the components that ask
  for it, lets React settle, and paints the tree. Nothing else is hidden
  in it, so a live stream, a preview and a test all draw the same way, and
  a frame is the same every time it is drawn.
- **`render`** is a root on a timer: it draws frame after frame at `fps`
  and gives each to an output.
- **Drawing** is done to the pixel as
  [embedded-graphics](https://github.com/embedded-graphics/embedded-graphics)
  does it (circles, Bresenham lines, stroke alignment, font formats), so a panel
  drawn here matches one drawn by a Rust program using it. That is how
  duckboard-js reproduces
  duckboard frame for frame.

There is no layout engine: a panel has a few thousand pixels, and every
one is placed on purpose. A `Box` gives its children their own
coordinates and, with `clip`, keeps them inside it; `useArea()` tells a
component how much room it has.

---

[Documentation index](README.md) · [Project README](../README.md)
