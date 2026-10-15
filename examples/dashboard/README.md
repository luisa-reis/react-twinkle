# react-twinkle dashboard

An example app built on [react-twinkle](https://www.npmjs.com/package/react-twinkle):
a dashboard for a 64×64 LED panel that cycles through four pages, each
sliding in over the last.

![The four pages: clock, weather, system, news](../../docs/screenshots/dashboard.png)

| Page    | Shows                                                           | Uses                                           |
| ------- | --------------------------------------------------------------- | ---------------------------------------------- |
| Clock   | an analog clock, the time and the date                          | `Circle`, `Line`, `Pixels`, `Text`, `useNow`   |
| Weather | the sky as an icon, the temperature, today's hours as a chart   | `LineChart`, shapes, data from Open-Meteo      |
| System  | this machine's load over the last minute, memory in use, uptime | `BarChart`, `BulletChart`, data from `node:os` |
| News    | your messages, each scrolling along its own line                | `Marquee`, `Box` with `clip`                   |

It is a separate npm package that installs react-twinkle from the
registry, so it can be copied out of this repository and used as the
start of your own app.

## Getting started

You need Node.js 20 or later, and for a panel, an LED matrix running
[WLED](https://kno.wled.ge) set up as a 64×64 2D matrix.

```sh
cd examples/dashboard
npm install

npm start -- --target wled.local       # stream to your panel over DDP
npm run dev -- --target wled.local     # the same, restarting on every save
npm run snapshot                       # dashboard.png, from sample data
```

The first run of any of these fetches the fonts (see [Fonts](#fonts)).

### Options

| Option                                   | Does                                                               |
| ---------------------------------------- | ------------------------------------------------------------------ |
| `--target <host[:port]>`                 | streams to a WLED device over DDP (UDP port 4048 unless said)      |
| `--png <file>`                           | writes an animated PNG instead                                     |
| `--place <name> --lat <deg> --lon <deg>` | real weather for that place; write a negative one as `--lon=-9.14` |
| `--fahrenheit`                           | temperatures in Fahrenheit                                         |
| `--page-seconds <n>`                     | how long each page shows (10)                                      |
| `--fps <n>`                              | frames a second (20)                                               |
| `--demo`                                 | sample data and, for a PNG, a fixed time: no network               |
| `--seconds <n>`                          | how long the PNG runs (one round of pages)                         |

Without `--lat` and `--lon` the weather page shows sample data, marked
"sample".

```sh
npm start -- --target wled.local --place Lisbon --lat 38.72 --lon=-9.14
```

## How it is built

```
src/
  main.tsx              the command line: options, then render() to DDP or frames to a PNG
  Dashboard.tsx         the pages, and the pager that slides one in over the last
  config.ts             what can be configured, and the defaults
  theme.ts              the colours
  fonts/                the font list, and registering the fetched fonts
  data/
    types.ts            what the pages show, as plain data
    sources.ts          live sources (Open-Meteo, node:os) and sample ones
    weather.ts          fetching and checking the forecast
    usePolling.ts       a hook that loads a value now and every so often
    DataProvider.tsx    loads the data once for all the pages, through context
  components/           widgets: AnalogClock, WeatherIcon, Header, PageDots
  pages/                one component a page
test/                   Vitest: the pages, the pager, the forecast parser
scripts/fetch-fonts.ts  downloads the fonts
```

A few choices worth copying:

- **Time comes from the frame, not the clock.** Pages read `useNow()` and
  the pager reads `useElapsedMs()`, never `Date.now()`. A frame is then a
  function of its number and time, which is what makes the PNG the same on
  every run and lets the tests draw any moment.
- **Data is loaded once, above the pages.** `DataProvider` polls the
  sources and hands the results down through context, so a page that
  slides out and back does not fetch again, and drawing never waits for
  the network.
- **Sources are passed in.** The app takes its data sources as a prop,
  so the PNG and the tests run on sample data with no network, and a new
  source (a calendar, a home-automation sensor) is one more function.
- **Failures keep the last good value.** A failed fetch leaves the page
  showing what it had, or "NO DATA" if it never had anything.

### Adding a page

1. Write a component in `src/pages/`. It is drawn in a 64×60 box; use
   `useArea()` for the size rather than fixed numbers.
2. If it needs data, add a function to `Sources` in `src/data/types.ts`,
   a live and a sample version in `src/data/sources.ts`, and poll it in
   `DataProvider.tsx`.
3. Add it to the list of pages in `src/Dashboard.tsx`.
4. `npm run dev -- --target <panel>` to see it as you edit, and `npm run
check` before committing.

The [react-twinkle documentation](../../docs/README.md) describes every
component and hook.

## Checking

```sh
npm run check       # tsc --noEmit, then the tests
```

## Fonts

react-twinkle has no fonts of its own, and this example keeps none in
the repository. `npm run fonts` (run for you before `start`, `dev`,
`snapshot` and `test`) downloads the
[embedded-graphics](https://crates.io/crates/embedded-graphics) crate
0.8.2 from crates.io, checks its SHA-256, and writes five of its
fixed-width fonts into `fonts/data.ts`, which is git-ignored. They are the
X11 "misc-fixed" fonts, in the public domain. To use other fonts, see
react-twinkle's [fonts documentation](../../docs/fonts.md).

## License

MIT, like react-twinkle.
