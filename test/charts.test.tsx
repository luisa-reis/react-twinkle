import type {ReactElement} from 'react';
import {describe, expect, it} from 'vitest';
import {BarChart, Box, BulletChart, LineChart, createRoot} from '../src';
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

describe('BarChart', () => {
  it('stands as many bars as fit on the bottom row, the latest in its own colour', () => {
    const chart = <BarChart values={[1, 2, 4]} color="#ff0000" last="#00ff00" barWidth={1} />;
    expect(draw(chart, 5, 4)).toEqual(['....g', '....g', '..r.g', 'r.r.g']);
  });

  it('centres the bars and never draws one under a pixel', () => {
    expect(draw(<BarChart values={[0, 8]} color="#0000ff" barWidth={2} gap={2} />, 8, 3)).toEqual([
      '.....bb.',
      '.....bb.',
      '.bb..bb.',
    ]);
  });

  it('draws a flat line on the bottom row while there are no values', () => {
    expect(draw(<BarChart empty="#00ff00" />, 3, 3)).toEqual(['...', '...', 'ggg']);
  });
});

describe('BulletChart', () => {
  it('draws the bar to the value over bands, with a marker at the target', () => {
    const chart = (
      <BulletChart value={50} target={80} ranges={[60]} color="#ff0000" marker="#00ff00" />
    );
    expect(draw(chart, 10, 7)).toEqual([
      '++++++++++',
      '++++++++g+',
      'rrrrr+++g+',
      'rrrrr+++g+',
      'rrrrr+++g+',
      '++++++++g+',
      '++++++++++',
    ]);
  });

  it('has no bar without a value and keeps the marker on the scale', () => {
    const chart = <BulletChart target={500} color="#ff0000" marker="#00ff00" />;
    expect(draw(chart, 6, 3)).toEqual(['+++++g', '+++++g', '+++++g']);
    expect(draw(<BulletChart value={NaN} color="#ff0000" />, 4, 3)[1]).toBe('++++');
  });

  it('scales from min to max', () => {
    const chart = <BulletChart value={0} min={-10} max={10} color="#ff0000" band="#000000" />;
    expect(draw(chart, 4, 3)).toEqual(['....', 'rr..', '....']);
  });
});
