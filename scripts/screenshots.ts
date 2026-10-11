// Draws the pictures the README shows, from the examples: a PNG of each,
// or an animated PNG of one that says how many `seconds` it runs, four
// times the panel's size.
//
//   npm run screenshots
//
// react-twinkle has no fonts of its own, and the examples are set in
// some: they are borrowed from duckboard-js, checked out beside this
// repository, which fetches them when it is built (`npm run fonts` there).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import type {ComponentType} from 'react';
import {build} from 'esbuild';

// What is imported below once it is built or found: this library, an
// example, and duckboard-js's fonts.
type Twinkle = typeof import('../src');
interface Example {
  default: ComponentType;
  size: {width: number; height: number};
  seconds?: number;
}
interface FontData {
  default: {mono: Record<string, string>; u8g2: Record<string, string>};
}
interface FontList {
  MONO: Record<string, number>;
}

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const out = path.join(root, 'docs', 'screenshots');
const SCALE = 4;
const FPS = 10;
// A fixed time, so the pictures do not change from one run to the next.
const START = new Date(2026, 9, 10, 12, 34, 50).getTime();

const work = fs.mkdtempSync(path.join(os.tmpdir(), 'twinkle-shots-'));
fs.symlinkSync(path.join(root, 'node_modules'), path.join(work, 'node_modules'));

const names = fs
  .readdirSync(path.join(root, 'examples'))
  .filter((name) => name.endsWith('.tsx'))
  .map((name) => path.basename(name, '.tsx'));

await build({
  entryPoints: [
    path.join(root, 'src', 'index.ts'),
    ...names.map((name) => path.join(root, 'examples', `${name}.tsx`)),
  ],
  outdir: work,
  outbase: root,
  bundle: true,
  splitting: true,
  format: 'esm',
  platform: 'node',
  jsx: 'automatic',
  external: [
    'react',
    'react/jsx-runtime',
    'react-reconciler',
    'react-reconciler/*',
    'jpeg-js',
    'omggif',
    'pngjs',
  ],
});

const twinkle: Twinkle = await import(pathToFileURL(path.join(work, 'src', 'index.js')).href);

const borrowed = path.join(root, '..', 'duckboard-js');
const fetched = path.join(borrowed, 'fonts', 'data.ts');
if (!fs.existsSync(fetched)) {
  throw new Error(`the examples need fonts: run \`npm run fonts\` in ${borrowed}`);
}
const {default: fonts}: FontData = await import(pathToFileURL(fetched).href);
const list = path.join(borrowed, 'src', 'fonts', 'list.ts');
const {MONO}: FontList = await import(pathToFileURL(list).href);
const decoded = (encoded: string) => Uint8Array.from(Buffer.from(encoded, 'base64'));
Object.entries(MONO).forEach(([name, baseline]) => {
  const [width, height] = name.split('x').map(Number);
  twinkle.registerMonoFont(name, {width, height, baseline, data: decoded(fonts.mono[name])});
});
Object.entries(fonts.u8g2).forEach(([name, data]) => twinkle.registerU8g2Font(name, decoded(data)));
const {createElement} = await import('react');

fs.mkdirSync(out, {recursive: true});
await Promise.all(
  names.map(async (name) => {
    const example: Example = await import(
      pathToFileURL(path.join(work, 'examples', `${name}.js`)).href
    );
    const panel = twinkle.createRoot({...example.size, fps: FPS});
    panel.render(createElement(example.default));
    const shot = (frame: number) => {
      const canvas = panel.frame({frame, now: new Date(START + (frame * 1000) / FPS)});
      return twinkle.scaleUp({data: Uint8Array.from(canvas.px), ...example.size}, SCALE);
    };
    const frames = Math.round((example.seconds ?? 0) * FPS);
    const bytes =
      frames > 0
        ? twinkle.encodeApng(
            Array.from({length: frames}, (unused, frame) => shot(frame)),
            FPS,
          )
        : twinkle.encodePng(shot(0));
    fs.writeFileSync(path.join(out, `${name}.png`), bytes);
    console.log(`docs/screenshots/${name}.png${frames > 0 ? ` (${frames} frames)` : ''}`);
  }),
);
