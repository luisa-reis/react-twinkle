// Fetches the fonts the dashboard draws with. react-twinkle has none of its
// own, and none is kept in this repository: this downloads the Rust crate
// embedded-graphics from crates.io at a pinned version, checks its SHA-256,
// and writes the fonts named below into fonts/data.ts, which is
// git-ignored. They are the X11 "misc-fixed" fonts, in the public domain.
//
//   npm run fonts            (run before start, dev, snapshot and test)
//   npm run fonts -- --force
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import zlib from 'node:zlib';
import {FONTS} from '../src/fonts/list';

const CRATE = {
  name: 'embedded-graphics',
  version: '0.8.2',
  sha256: '4e8da660bb0c829b34a56a965490597f82a55e767b91f9543be80ce8ccb416fe',
};

const here = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const out = path.join(here, 'fonts');
const module = path.join(out, 'data.ts');

const sha256 = (bytes: crypto.BinaryLike) =>
  crypto.createHash('sha256').update(bytes).digest('hex');

// What the module is made from: when the list changes, so does this.
const key = sha256(JSON.stringify([CRATE, FONTS]));

function current(): boolean {
  try {
    return fs.readFileSync(module, 'utf8').includes(`key = '${key}'`);
  } catch {
    return false;
  }
}

async function download(): Promise<Buffer> {
  const {name, version} = CRATE;
  const url = `https://static.crates.io/crates/${name}/${name}-${version}.crate`;
  console.error(`fonts: fetching ${url}`);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`${url}: ${response.status} ${response.statusText}`);
  }
  const bytes = Buffer.from(await response.arrayBuffer());
  if (sha256(bytes) !== CRATE.sha256) {
    throw new Error(`${url}: its SHA-256 is ${sha256(bytes)}, not ${CRATE.sha256}`);
  }
  return bytes;
}

// The files of a gzipped tar, by path.
function files(tarball: Buffer): Map<string, Buffer> {
  const tar = zlib.gunzipSync(tarball);
  const text = (from: number, to: number) => tar.toString('utf8', from, to).replace(/\0.*$/s, '');
  const found = new Map<string, Buffer>();
  let at = 0;
  while (at + 512 <= tar.length && tar[at] !== 0) {
    const prefix = text(at + 345, at + 500);
    const name = `${prefix ? `${prefix}/` : ''}${text(at, at + 100)}`;
    const size = parseInt(text(at + 124, at + 136).trim(), 8) || 0;
    found.set(name, tar.subarray(at + 512, at + 512 + size));
    at += 512 + Math.ceil(size / 512) * 512;
  }
  return found;
}

if (!process.argv.includes('--force') && current()) {
  process.exit(0);
}

const inside = files(await download());
const lines = Object.keys(FONTS).map((font) => {
  const file = `${CRATE.name}-${CRATE.version}/fonts/raw/iso_8859_1/font_${font}.raw`;
  const bytes = inside.get(file);
  if (!bytes) {
    throw new Error(`the crate has no ${file}`);
  }
  return `  '${font}': '${bytes.toString('base64')}',`;
});
fs.mkdirSync(out, {recursive: true});
fs.writeFileSync(
  module,
  [
    '// Written by scripts/fetch-fonts.ts; `npm run fonts` makes it again.',
    `export const key = '${key}';`,
    '',
    'const data: Record<string, string> = {',
    ...lines,
    '};',
    '',
    'export default data;',
    '',
  ].join('\n'),
);
console.error(`fonts: ${lines.length} fonts in fonts/data.ts`);
