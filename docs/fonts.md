# Fonts

![Fixed-width and U8g2 fonts](screenshots/fonts.png)

## Registering fonts

react-twinkle reads fonts but has none: fonts are other people's work,
each under its own terms, so the application provides the ones it draws
with and registers them before drawing.

| Call                                                                      | Registers                                                                                                                                                                            |
| ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `registerMonoFont(name, { width, height, baseline, data, glyphsPerRow })` | a fixed-width bitmap font from its glyph image, as embedded-graphics keeps them: `glyphsPerRow` glyphs a row (sixteen unless said), one bit a pixel, ASCII then Latin-1's upper half |
| `registerU8g2Font(name, data)`                                            | a [U8g2](https://github.com/olikraus/u8g2/wiki/fntlistall) font from the bytes of its data, most of them proportional                                                                |
| `registerFont(name, font)`                                                | anything that implements a font: `kind`, `advance(text)`, `inkWidth(text)`, `extent()`, `draw(surface, text, x, y, color)`                                                           |

`font` on `Text` and `Marquee` is the name a font was registered under.
Left out, it is the default font: the first registered, or the one named
with `setDefaultFont(name)`. `fontNames()` lists what is registered,
`measureText(text, font)` measures a line, `getFont(name).extent()` says
how far it rises and falls, and `clearFonts()` forgets them all. Drawing
text before any font is registered is an error that says so.

## Why there are none here

react-twinkle has no fonts in it. It reads two formats, and the
application registers the fonts it draws with, as above.
A font is its author's work under its own terms, which is the reason: the
application chooses which fonts to use, where to get them and whether to
distribute them, and this library's MIT licence covers none of them.

The pictures in `docs/screenshots` are drawn with fonts borrowed from
duckboard-js; they show glyphs of those fonts, as any screenshot does.

## The formats

- **Fixed-width bitmaps**, `registerMonoFont`: one image of all the
  glyphs, sixteen to a row unless said otherwise, one bit a pixel with the
  leftmost pixel in the highest bit, every row of the image padded to
  whole bytes. The glyphs are those of ASCII from the space on (96), then
  of Latin-1 from the no-break space on (96 more). This is the form the
  [embedded-graphics](https://github.com/embedded-graphics/embedded-graphics)
  crate keeps the X11 "misc-fixed" fonts in, under `fonts/raw`.
- **U8g2 fonts**, `registerU8g2Font`: the bytes of a font in
  [U8g2](https://github.com/olikraus/u8g2)'s compressed format, the
  contents of a `u8g2_font_…` array in U8g2's sources, or a `.u8g2font`
  file of the [u8g2-fonts](https://github.com/Finomnis/u8g2-fonts) crate.
  [U8g2's wiki](https://github.com/olikraus/u8g2/wiki/fntlistall) shows
  them all, and its
  [font groups](https://github.com/olikraus/u8g2/wiki/fntgrp) give each
  one's licence.

Any other format works through `registerFont`, with an object that
measures and draws.

## Fetching fonts when building

Keeping fonts out of a repository means fetching them when the
application is built. duckboard-js is the worked
example: its `scripts/fetch-fonts.ts` downloads the two crates above
from crates.io at pinned versions, checks their SHA-256, takes out the
fonts `src/fonts/list.ts` names and writes them into a git-ignored module;
`src/fonts/register.ts` registers them. Its `docs/fonts.md` lists those
fonts with their terms.

---

[Documentation index](README.md) · [Project README](../README.md)
