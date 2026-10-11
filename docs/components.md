# Components and charts

Every component react-twinkle exports, with its props, and the three
charts. For pictures see [pictures.md](pictures.md); for text see also
[fonts.md](fonts.md).

![Every primitive on a 64×64 panel](screenshots/primitives.png)

## Components

Coordinates are pixels, `(0, 0)` the top-left corner of the box a
component is in. A colour is `"#rrggbb"`, `"#rrggbbaa"` (blended over what
is under it) or `{ r, g, b, a }`.

| Component     | Draws                                                         | Props                                           |
| ------------- | ------------------------------------------------------------- | ----------------------------------------------- |
| `Box`         | a region its children are placed in                           | `x y width height clip background`              |
| `Text`        | one line of text                                              | `x y font color align baseline`                 |
| `Marquee`     | a line centred in its box, scrolling when too wide            | `y font color speed gap baseline`               |
| `Rect`        | a rectangle                                                   | `x y width height fill stroke strokeWidth`      |
| `Circle`      | a circle, by diameter from its top-left                       | `x y diameter fill stroke strokeWidth`          |
| `Line`        | a one-pixel line                                              | `from to color`                                 |
| `Polyline`    | a one-pixel line through points                               | `points color`                                  |
| `Pixels`      | single pixels, one colour or each its own                     | `points color colors`                           |
| `Image`       | RGB or RGBA bytes                                             | `x y width height data alpha`                   |
| `LineChart`   | a series as a line across its box; with `fill`, an area chart | `values color fill dot empty`                   |
| `BarChart`    | a series as bars standing on zero                             | `values color last barWidth gap empty`          |
| `BulletChart` | a value on a scale, over bands, with a marker at a target     | `value target min max ranges color marker band` |

Later siblings are drawn over earlier ones. Each component's props are
exported as a type: `BoxProps`, `TextProps`, and so on.

## Charts

A chart fills the `Box` it is in, so its size is the box's:

```jsx
<Box x={2} y={40} width={60} height={20}>
  <LineChart values={history} color="#50aaff" fill={['#50aaff60', '#50aaff00']} dot="#ffffff" />
</Box>
```

![A line, an area, bars and a bullet chart](screenshots/charts.png)

- **`LineChart`** puts the lowest value on the bottom row and the highest
  on the top one. More values than columns are averaged, fewer are joined
  by straight lines. `fill` colours what is under the line, from its first
  colour on the top row to its second on the bottom; `dot` marks the
  latest value.
- **`BarChart`** draws as many bars as fit, `barWidth` wide and `gap`
  apart, centred. The bottom is zero, or the lowest value when one is
  negative, and no bar is under a pixel.
- **`BulletChart`** is Stephen Few's bullet graph: bands to each of
  `ranges` and to `max`, a bar to `value`, a marker at `target`.
- While there are no values a line or bar chart draws a flat line in
  `empty`.

`columns`, `barHeights` and `bulletHeights` are exported for charts of
your own.

---

[Documentation index](README.md) · [Project README](../README.md)
