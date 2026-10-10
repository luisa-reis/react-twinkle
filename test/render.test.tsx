import {useEffect, useState} from 'react';
import type {ReactNode} from 'react';
import {beforeAll, describe, expect, it} from 'vitest';
import {
  Box,
  Circle,
  Line,
  Marquee,
  Pixels,
  Polyline,
  Rect,
  Text,
  Image,
  clearFonts,
  createRoot,
  registerMonoFont,
  render,
  useArea,
  useFrame,
} from '../src';
import type {Area, Canvas, Output} from '../src';
import {tinyMono} from './support/fonts';

beforeAll(() => {
  clearFonts();
  registerMonoFont('tiny', tinyMono());
});

function rows(canvas: Canvas): string[] {
  const out: string[] = [];
  for (let y = 0; y < canvas.height; y += 1) {
    let row = '';
    for (let x = 0; x < canvas.width; x += 1) {
      const {r, g, b} = canvas.get(x, y);
      row += r || g || b ? '#' : '.';
    }
    out.push(row);
  }
  return out;
}

function draw(element: ReactNode, size = {width: 8, height: 8}): string[] {
  const root = createRoot(size);
  root.render(element);
  return rows(root.frame({frame: 0, now: new Date(0)}));
}

describe('the renderer', () => {
  it('draws primitives in order, later over earlier', () => {
    const root = createRoot({width: 4, height: 2});
    root.render(
      <>
        <Rect width={4} height={2} fill="#ff0000" />
        <Rect x={1} width={2} height={1} fill="#0000ff" />
      </>,
    );
    const canvas = root.frame();
    expect(canvas.get(0, 0)).toEqual({r: 255, g: 0, b: 0});
    expect(canvas.get(1, 0)).toEqual({r: 0, g: 0, b: 255});
  });

  it('places children in their box and clips them to it', () => {
    const picture = draw(
      <Box x={2} y={1} width={4} height={3} clip>
        <Rect x={-1} y={1} width={8} height={8} fill="#ffffff" />
      </Box>,
    );
    expect(picture).toEqual([
      '........',
      '........',
      '..####..',
      '..####..',
      '........',
      '........',
      '........',
      '........',
    ]);
  });

  it('draws every primitive', () => {
    const picture = draw(
      <>
        <Circle diameter={3} fill="#ffffff" />
        <Line from={[4, 0]} to={[7, 0]} />
        <Polyline
          points={[
            [0, 4],
            [2, 6],
            [4, 4],
          ]}
        />
        <Pixels
          points={[
            [7, 7],
            [6, 7],
          ]}
          colors={['#ffffff', '#000000']}
        />
        <Image x={6} y={3} width={1} height={2} data={new Uint8Array([9, 9, 9, 0, 0, 0])} />
      </>,
    );
    expect(picture).toEqual([
      '.#..####',
      '###.....',
      '.#......',
      '......#.',
      '#...#...',
      '.#.#....',
      '..#.....',
      '.......#',
    ]);
  });

  it('draws text, joined from its pieces and aligned', () => {
    const count = 4;
    const left = draw(<Text font="tiny">A{count}</Text>, {width: 8, height: 6});
    const right = draw(
      <Text x={8} font="tiny" align="right">
        A4
      </Text>,
      {width: 8, height: 6},
    );
    expect(left[0]).toBe('.#..#.#.');
    expect(right[0]).toBe('..#..#.#');
    expect(() => draw(<Box>loose</Box>)).toThrow(/must be inside a <Text>/);
  });

  it('gives hooks the frame and the area', () => {
    const seen: [number, number, Area][] = [];
    function Probe() {
      const {frame, elapsedMs} = useFrame();
      seen.push([frame, elapsedMs, useArea()]);
      return null;
    }
    const root = createRoot({width: 8, height: 4, fps: 4});
    root.render(
      <Box width={3} height={2}>
        <Probe />
      </Box>,
    );
    root.frame({frame: 6, now: new Date(0)});
    expect(seen.at(-1)).toEqual([6, 1500, {width: 3, height: 2}]);
  });

  it('keeps state between frames and draws again when it changes', () => {
    function Blink() {
      const {frame} = useFrame();
      const [on, setOn] = useState(false);
      useEffect(() => setOn(frame % 2 === 1), [frame]);
      return on ? <Rect width={1} height={1} fill="#ffffff" /> : null;
    }
    const root = createRoot({width: 1, height: 1});
    root.render(<Blink />);
    expect(rows(root.frame({frame: 0}))).toEqual(['.']);
    expect(rows(root.frame({frame: 1}))).toEqual(['#']);
    expect(rows(root.frame({frame: 2}))).toEqual(['.']);
  });

  it('scrolls a marquee that does not fit', () => {
    const element = (
      <Box width={8} height={6}>
        <Marquee font="tiny">WIDE</Marquee>
      </Box>
    );
    const root = createRoot({width: 8, height: 6, fps: 5});
    root.render(element);
    const first = rows(root.frame({frame: 0})).join('\n');
    const later = rows(root.frame({frame: 1})).join('\n');
    expect(later).not.toBe(first);
    expect(draw(<Marquee font="tiny">I</Marquee>, {width: 8, height: 6})[0]).toBe('...###..');
  });

  it('streams frames to an output until told to stop', async () => {
    const sent: (number | string)[] = [];
    const output: Output = {send: (px) => sent.push(px[0]), close: () => sent.push('closed')};
    function Ramp() {
      const {frame} = useFrame();
      return <Rect width={1} height={1} fill={{r: frame + 1, g: 0, b: 0, a: 255}} />;
    }
    const app = render(<Ramp />, {width: 1, height: 1, fps: 200, frames: 3, output});
    await app.waitUntilExit();
    expect(sent).toEqual([1, 2, 3, 'closed']);
  });
});
