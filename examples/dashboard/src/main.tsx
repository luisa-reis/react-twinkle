// Runs the dashboard: streams it to a WLED panel, or writes an animated PNG
// of it.
//
//   npm start -- --target wled.local
//   npm run dev -- --target wled.local     (restarts when a file changes)
//   npm run snapshot                       (dashboard.png, from sample data)
import fs from 'node:fs';
import {parseArgs} from 'node:util';
import {DdpOutput, createRoot, encodeApng, render, scaleUp} from 'react-twinkle';
import './fonts/register';
import {DEFAULT_CONFIG} from './config';
import type {Config} from './config';
import Dashboard from './Dashboard';
import {demoSources, liveSources} from './data/sources';
import type {Sources} from './data/types';

const USAGE = `Usage:
  npm start -- --target <host[:port]> [options]   stream to a WLED panel over DDP
  npm start -- --png <file> [options]             write an animated PNG

Options:
  --place <name> --lat <degrees> --lon <degrees>  where the weather is for
                                                  (a negative one as --lon=-9.14)
  --fahrenheit                                    temperatures in Fahrenheit
  --page-seconds <n>                              how long each page shows (${DEFAULT_CONFIG.pageSeconds})
  --fps <n>                                       frames a second (${DEFAULT_CONFIG.fps})
  --demo                                          sample data and a fixed time, no network
  --seconds <n>                                   how long the PNG runs (one round of pages)
`;

function fail(message: string): never {
  console.error(`${message}\n\n${USAGE}`);
  process.exit(2);
}

function number(value: string | undefined, name: string): number | undefined {
  if (value === undefined) return undefined;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) fail(`--${name} must be a number, not "${value}"`);
  return parsed;
}

const {values} = (() => {
  try {
    return parseArgs({
      options: {
        target: {type: 'string'},
        png: {type: 'string'},
        place: {type: 'string'},
        lat: {type: 'string'},
        lon: {type: 'string'},
        fahrenheit: {type: 'boolean'},
        'page-seconds': {type: 'string'},
        fps: {type: 'string'},
        demo: {type: 'boolean'},
        seconds: {type: 'string'},
        help: {type: 'boolean', short: 'h'},
      },
    });
  } catch (error) {
    return fail((error as Error).message);
  }
})();

if (values.help) {
  console.log(USAGE);
  process.exit(0);
}
if (!values.target === !values.png) {
  fail('Give either --target or --png.');
}

const latitude = number(values.lat, 'lat');
const longitude = number(values.lon, 'lon');
if ((latitude === undefined) !== (longitude === undefined)) {
  fail('Give --lat and --lon together.');
}

const config: Config = {
  ...DEFAULT_CONFIG,
  fps: number(values.fps, 'fps') ?? DEFAULT_CONFIG.fps,
  pageSeconds: number(values['page-seconds'], 'page-seconds') ?? DEFAULT_CONFIG.pageSeconds,
  units: values.fahrenheit ? 'fahrenheit' : 'celsius',
  place:
    latitude !== undefined && longitude !== undefined
      ? {name: values.place ?? 'Weather', latitude, longitude}
      : undefined,
};
const sources: Sources = values.demo ? demoSources : liveSources(config);
const app = <Dashboard config={config} sources={sources} />;
const {width, height, fps} = config;

if (values.png) {
  // Frame by frame, each for its own time, so the picture is the same on
  // every run with --demo.
  const seconds = number(values.seconds, 'seconds') ?? 4 * config.pageSeconds;
  const start = values.demo ? new Date(2026, 9, 15, 10, 9, 30).getTime() : Date.now();
  const root = createRoot({width, height, fps});
  root.render(app);
  // Let the data sources answer before the first frame.
  await new Promise((resolve) => {
    setTimeout(resolve, 50);
  });
  const frames = Array.from({length: Math.round(seconds * fps)}, (unused, frame) => {
    const canvas = root.frame({frame, now: new Date(start + (frame * 1000) / fps)});
    return scaleUp({data: Uint8Array.from(canvas.px), width, height}, 4);
  });
  root.unmount();
  fs.writeFileSync(values.png, encodeApng(frames, fps));
  console.log(`${values.png}: ${frames.length} frames, ${seconds} s`);
} else if (values.target) {
  const output = new DdpOutput(values.target);
  const instance = render(app, {width, height, fps, output});
  const stop = () => instance.unmount();
  process.once('SIGINT', stop);
  process.once('SIGTERM', stop);
  console.log(`Streaming ${width}x${height} at ${fps} fps to ${values.target}; Ctrl-C to stop.`);
  await instance.waitUntilExit();
}
