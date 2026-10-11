# Types

react-twinkle is written in TypeScript and comes with its declarations.
Besides the components' props, it exports the types its functions take
and give:

| Type                                                                                     | Is                                                                                       |
| ---------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `Color`, `ColorLike`                                                                     | `{ r, g, b, a }`, and that or a `"#rrggbb"` string, as a colour prop is                  |
| `Point`                                                                                  | a pixel's place, `[x, y]`                                                                |
| `Font`, `MonoFontDescription`                                                            | what `registerFont` and `registerMonoFont` take                                          |
| `FrameValue`, `Area`, `App`                                                              | what `useFrame()`, `useArea()` and `useApp()` give                                       |
| `RootOptions`, `FrameOptions`                                                            | what `createRoot` and `root.frame` take                                                  |
| `RenderOptions`, `Output`, `Instance`                                                    | what `render` takes, where it sends frames, and what it gives                            |
| `Picture`, `AnimationPart`                                                               | `{ data, width, height }`, and a stored frame of an animated PNG                         |
| `PictureFrame`, `ScaleOptions`, `RotateOptions`, `TranslateOptions`, `UsePictureOptions` | a picture of an animation, and what `scale`, `rotate`, `translate` and `usePicture` take |
| `Fit`, `ScaleFilter`, `SampleFilter`, `Edge`                                             | the names those options go by                                                            |

Everything exported is listed in `src/index.ts`.

---

[Documentation index](README.md) · [Project README](../README.md)
