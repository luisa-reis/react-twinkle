# CLAUDE.md

Context for Claude Code sessions working on react-twinkle.

## What it is

- A custom React renderer for LED matrices, on the model of Ink:
  `react-reconciler` builds a tree of plain nodes from components, and
  once a frame the tree is painted onto an RGB canvas, which an output
  sends to a WLED panel over DDP (or writes as a PNG).
- Its drawing is a port of the Rust crates
  duckboard draws with: embedded-graphics' primitives and
  mono fonts, and the u8g2-fonts reader. A pixel must land where those put
  it, and in the same order (order shows when a colour has alpha).
  duckboard-js, beside this repository, is the proof:
  its `npm run compare` renders duckboard's demos with both and compares
  every frame. **After changing anything in `src/graphics`, `src/fonts`,
  `src/paint.ts` or a component, run `npm run check` in ../duckboard-js
  too.**

## Documentation

`README.md` is short on purpose: what the project is, getting started,
the licence. Reference material is in `docs/`, one subject a file, and
`docs/README.md` is the index. Look there first for how something is
used, and put new reference text there, not in the README.

| Subject                                            | File                   |
| -------------------------------------------------- | ---------------------- |
| the design: reconciler, root, paint, no layout     | `docs/how-it-works.md` |
| each component's props; the charts                 | `docs/components.md`   |
| decoding, scaling, rotating pictures; `usePicture` | `docs/pictures.md`     |
| the hooks                                          | `docs/hooks.md`        |
| registering fonts, formats, sources, licences      | `docs/fonts.md`        |
| DDP, PNG, APNG; `render` and `createRoot`          | `docs/outputs.md`      |
| exported types                                     | `docs/types.md`        |
| building, testing, screenshots                     | `docs/developing.md`   |

A new file in `docs/` gets a row here and in `docs/README.md`.

## Layout

- `src/reconciler.ts` — the host config; `src/nodes.ts` — the node tree,
  and the host elements' props as JSX knows them.
- `src/root.tsx` — a tree plus a canvas; `frame()` draws one frame.
  `src/render.ts` — a root on a timer, streaming to an output.
- `src/paint.ts` — walks the tree and draws each node.
- `src/canvas.ts`, `src/color.ts` — RGB bytes, alpha blending, colours.
- `src/graphics/` — rectangles, circles, lines, and the surface (offset
  and clip) a box gives its children.
- `src/fonts/` — the registry and the readers of the two font formats.
  There are no fonts in the repository, on purpose: the application
  registers its own (`registerMonoFont`, `registerU8g2Font`). Do not add
  font files, here or as test fixtures; the tests draw with fonts made in
  `test/support/fonts.ts`.
- `src/components/` — `Box`, `Text`, `Marquee`, `Rect`, `Circle`, `Line`,
  `Polyline`, `Pixels`, `Image`, and the charts `LineChart`, `BarChart`,
  `BulletChart`; `src/hooks.ts`, `src/contexts.ts`.
- `src/charts/series.ts` — fitting a series to the pixels there are.
  duckboard-js's chart tiles draw with these components, so they are
  held to the same pixel-for-pixel standard.
- `src/pictures/` — a picture (`{data, width, height}`, RGB or RGBA) and
  what is done to one: `decode.ts` (JPEG, PNG, GIF), `scale.ts`,
  `transform.ts` (rotate, translate, flip), `gamma.ts`, and the
  `usePicture` hook. They are functions of a picture, not props of
  `Image`, and keep the alpha until it is painted. The arithmetic is
  plain JavaScript numbers, with no single precision; only `scale`'s
  Lanczos filter is held to duckboard's pixels (duckboard-js scales with
  it), so leave its RGB path as it is.
- `src/output/` — DDP, PNG and animated PNG.
- `examples/` — small components; `npm run screenshots` draws
  `docs/screenshots` from them.
- `examples/dashboard/` — a complete app, a package of its own that
  installs react-twinkle from npm (not from `src`): its own
  `npm run check`, outside this repository's lint and type-check.
  `docs/screenshots/dashboard.png` is its `npm run snapshot`.
- `scripts/` — the build and the screenshots, TypeScript run with `tsx`.

## Checking

```sh
npm run check        # eslint, prettier --check, tsc --noEmit, vitest
npm run build        # dist/index.js, one module, React left external,
                     # and dist/*.d.ts from tsconfig.build.json
npm run screenshots  # after a change that shows in the examples; needs
                     # the fonts fetched in ../duckboard-js (npm run fonts)
```

## Conventions

- Strict TypeScript: no `any`, no `@ts-ignore` or `@ts-expect-error`. A
  cast is rare and has a comment saying why it holds. A component's props
  are an exported interface (`BoxProps`), and a type a caller needs is
  exported from `index.ts`.
- The compiled JavaScript is the code as written with the types taken
  out: a class declares its fields without initialisers and sets them in
  its constructor (`useDefineForClassFields` is off), and nothing is
  rearranged to please the compiler.
- Airbnb's ESLint rules for React and TypeScript, with Prettier.
  typescript-eslint's `no-use-before-define` is on for functions, classes
  and variables. No `for...of`, no `++`, no bitwise operators outside
  `src/fonts`, `src/output`, `src/color.ts` and `src/canvas.ts`. Defaults
  are default parameters, not `defaultProps`.
- No layout engine and no hidden state in drawing: a frame is a function
  of the tree, the frame number and the time. Keep `root.frame()`
  synchronous.
- A new primitive is a node type and its element's props in `nodes.ts`, a
  case in `paint.ts`, a component, an export in `index.ts`, a test, and a
  line in `docs/components.md`.
- Fonts are other people's work under their own terms, so none is kept
  here (`docs/fonts.md`); the code is MIT.
- The repo uses jujutsu (colocated with git). Commits are small, with a
  subject of at most 60 characters and at most four short body lines.
