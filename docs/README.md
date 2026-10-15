# react-twinkle documentation

The [project README](../README.md) says what react-twinkle is and how to
start. Everything else is here, one subject a file.

| To find out                                                                                                       | Read                                  |
| ----------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| how a component becomes pixels on a panel; why there is no layout                                                 | [how-it-works.md](how-it-works.md)    |
| what `Box`, `Text`, `Marquee`, `Rect`, `Circle`, `Line`, `Polyline`, `Pixels` and `Image` take                    | [components.md](components.md)        |
| how `LineChart`, `BarChart` and `BulletChart` draw a series                                                       | [components.md](components.md#charts) |
| how to decode, scale, rotate, move or gamma-correct a picture; `usePicture`                                       | [pictures.md](pictures.md)            |
| what `useFrame`, `useNow`, `useElapsedMs`, `useArea` and `useApp` give                                            | [hooks.md](hooks.md)                  |
| how to register fonts, which formats are read, where to get them, why none is included                            | [fonts.md](fonts.md)                  |
| how to send frames to WLED (DDP), write a PNG or APNG, or draw frames yourself; `render` and `createRoot` options | [outputs.md](outputs.md)              |
| which TypeScript types are exported                                                                               | [types.md](types.md)                  |
| how to build, test, lint and redraw the screenshots                                                               | [developing.md](developing.md)        |

Also in the repository:

- `examples/` has a small component for each subject; `screenshots/` here
  has the picture each one draws.
- `examples/dashboard/` is a complete app with pages, widgets, live data
  and tests, installing react-twinkle from npm; its README explains how it
  is built.
- `src/index.ts` lists everything the package exports.
- `CLAUDE.md` at the top has the source layout and the conventions for
  changing the code.
