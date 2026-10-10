import {describe, expect, it} from 'vitest';
import {barHeights, bulletHeights, columns} from '../src/charts/series';

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
