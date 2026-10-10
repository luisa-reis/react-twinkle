import type {ReactElement} from 'react';
import {describe, expect, it} from 'vitest';
import {Box, LineChart, createRoot} from '../src';
import type {Canvas} from '../src';
import {barHeights, bulletHeights, columns} from '../src/charts/series';

// A canvas as rows of letters: `r`, `g`, `b` or `w` for a pixel that is
// mostly that colour, `+` for any other lit one, `.` for a dark one.
function rows(canvas: Canvas): string[] {
  const out: string[] = [];
  for (let y = 0; y < canvas.height; y += 1) {
    let row = '';
    for (let x = 0; x < canvas.width; x += 1) {
      const {r, g, b} = canvas.get(x, y);
      const key = [r, g, b].map((v) => (v > 127 ? 1 : 0)).join('');
      const names: Record<string, string> = {'100': 'r', '010': 'g', '001': 'b', '111': 'w'};
      row += names[key] ?? (r + g + b > 0 ? '+' : '.');
    }
    out.push(row);
  }
  return out;
}

function draw(element: ReactElement, width: number, height: number): string[] {
  const root = createRoot({width, height});
  root.render(
    <Box width={width} height={height}>
      {element}
    </Box>,
  );
  return rows(root.frame({frame: 0, now: new Date(0)}));
}

describe('series', () => {
  it('average or stretch to the columns there are', () => {
    expect(columns([1, 3, 5, 7], 2)).toEqual([2, 6]);
    expect(columns([1, 3], 5)).toEqual([1, 1.5, 2, 2.5, 3]);
    expect(columns([4], 3)).toEqual([4, 4, 4]);
    expect(columns([1, 2, 3], 3)).toEqual([1, 2, 3]);
  });

  it('stand bars on zero', () => {
    expect(barHeights([0, 5, 10], 20)).toEqual([1, 10, 20]);
    expect(barHeights([90, 100], 10)).toEqual([9, 10]);
    expect(barHeights([-10, 0, 10], 10)).toEqual([1, 5, 10]);
    expect(barHeights([0, 0], 10)).toEqual([1, 1]);
  });

  it("put a bullet's bar and marker in the middle", () => {
    for (let height = 1; height <= 24; height += 1) {
      const [bar, marker] = bulletHeights(height);
      expect(bar >= 1 && bar <= marker && marker <= height).toBe(true);
      expect((height - bar) % 2).toBe(0);
      expect((height - marker) % 2).toBe(0);
    }
    expect(bulletHeights(7)).toEqual([3, 5]);
    expect(bulletHeights(10)).toEqual([4, 8]);
    expect(bulletHeights(2)).toEqual([2, 2]);
  });
});

describe('LineChart', () => {
  it('runs from the lowest value on the bottom row to the highest on the top', () => {
    expect(draw(<LineChart values={[0, 1, 2, 3, 4]} color="#ff0000" />, 5, 5)).toEqual([
      '....r',
      '...r.',
      '..r..',
      '.r...',
      'r....',
    ]);
  });

  it('stretches a short series and draws a level one through the middle', () => {
    expect(draw(<LineChart values={[0, 4]} />, 5, 5)[0]).toBe('....w');
    expect(draw(<LineChart values={[3, 3]} />, 4, 5)).toEqual([
      '....',
      '....',
      'wwww',
      '....',
      '....',
    ]);
  });

  it('fills what is under the line and dots the latest value', () => {
    const fill = ['#0000ff', '#0000ff'] as const;
    expect(draw(<LineChart values={[0, 2]} color="#ff0000" fill={fill} />, 3, 3)).toEqual([
      '..r',
      '.rb',
      'rbb',
    ]);
    expect(draw(<LineChart values={[0, 1]} color="#ff0000" dot="#00ff00" />, 5, 5)).toEqual([
      '..ggg',
      '..ggg',
      '..ggg',
      '.r...',
      '.....',
    ]);
  });

  it('draws a flat line while there are no values', () => {
    expect(draw(<LineChart empty="#00ff00" />, 3, 4)).toEqual(['...', '...', 'ggg', '...']);
    expect(draw(<LineChart values={[]} empty="#00ff00" />, 3, 4)[2]).toBe('ggg');
  });
});
