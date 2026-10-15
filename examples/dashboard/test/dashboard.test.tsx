import {createRoot} from 'react-twinkle';
import {afterEach, describe, expect, it} from 'vitest';
import '../src/fonts/register';
import {handEnd} from '../src/components/AnalogClock';
import {DEFAULT_CONFIG} from '../src/config';
import Dashboard, {SLIDE_MS} from '../src/Dashboard';
import {demoSources} from '../src/data/sources';

const {width, height, fps, pageSeconds} = DEFAULT_CONFIG;
const START = new Date(2026, 9, 15, 10, 9, 30).getTime();

let root: ReturnType<typeof createRoot> | undefined;
afterEach(() => root?.unmount());

// The dashboard on sample data, once the sources have answered.
async function dashboard() {
  root = createRoot({width, height, fps});
  root.render(<Dashboard config={DEFAULT_CONFIG} sources={demoSources} />);
  await new Promise((resolve) => {
    setTimeout(resolve, 10);
  });
  const shown = root;
  return (seconds: number) => {
    const canvas = shown.frame({
      frame: Math.round(seconds * fps),
      now: new Date(START + seconds * 1000),
    });
    return Uint8Array.from(canvas.px);
  };
}

const lit = (px: Uint8Array) => px.filter((value) => value > 0).length;

describe('handEnd', () => {
  it('points up at the start of a turn and right a quarter of the way round', () => {
    expect(handEnd([10, 10], 5, 0)).toEqual([10, 5]);
    expect(handEnd([10, 10], 5, 0.25)).toEqual([15, 10]);
    expect(handEnd([10, 10], 5, 0.5)).toEqual([10, 15]);
  });
});

describe('Dashboard', () => {
  it('draws every page', async () => {
    const at = await dashboard();
    const pages = [0, 1, 2, 3].map((page) => at(page * pageSeconds + pageSeconds / 2));
    pages.forEach((px) => expect(lit(px)).toBeGreaterThan(200));
    expect(new Set(pages.map((px) => Buffer.from(px).toString('hex'))).size).toBe(4);
  });

  it('comes back to the first page after the last', async () => {
    const at = await dashboard();
    // The weather page, which shows the time only by the hour.
    const first = at(pageSeconds + 5);
    const again = at(5 * pageSeconds + 5);
    expect(Buffer.from(again).equals(Buffer.from(first))).toBe(true);
  });

  it('slides the next page in', async () => {
    const at = await dashboard();
    const before = at(pageSeconds - 0.5);
    const sliding = at(pageSeconds + SLIDE_MS / 2000);
    const after = at(pageSeconds + 1);
    expect(Buffer.from(sliding).equals(Buffer.from(before))).toBe(false);
    expect(Buffer.from(sliding).equals(Buffer.from(after))).toBe(false);
  });

  it('draws the same frame for the same time', async () => {
    const at = await dashboard();
    expect(Buffer.from(at(23.5)).equals(Buffer.from(at(23.5)))).toBe(true);
  });
});
