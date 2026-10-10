// What the charts share: fitting a series of values to the pixels there
// are, and the proportions of a bullet chart.

/**
 * `values` as `count` values: the mean of each stretch when there are
 * more, a straight line between neighbours when there are fewer.
 */
export function columns(values: readonly number[], count: number): number[] {
  const n = values.length;
  const out: number[] = [];
  for (let i = 0; i < count; i += 1) {
    if (n >= count) {
      const from = Math.floor((i * n) / count);
      const to = Math.max(Math.floor(((i + 1) * n) / count), from + 1);
      const stretch = values.slice(from, to);
      out.push(stretch.reduce((sum, value) => sum + value, 0) / stretch.length);
    } else {
      const at = (i * (n - 1)) / (count - 1);
      const k = Math.trunc(at);
      out.push(values[k] + (values[Math.min(k + 1, n - 1)] - values[k]) * (at - k));
    }
  }
  return out;
}

/**
 * How tall each of `values` stands in `rows` pixels, counted from zero, or
 * from the lowest value when one is negative: the highest fills the rows,
 * and none is under a pixel, so a bar shows where a value is.
 */
export function barHeights(values: readonly number[], rows: number): number[] {
  const base = Math.min(0, ...values);
  const high = Math.max(base, ...values);
  return values.map((value) => {
    const up = high > base ? (value - base) / (high - base) : 0;
    return Math.min(Math.max(Math.round(up * rows), 1), Math.max(rows, 1));
  });
}

/**
 * How tall the bar and the marker of a bullet chart are in an area
 * `height` high, as [bar, marker]: the bar about a third of it and the
 * marker about two thirds, each leaving the same above as below.
 */
export function bulletHeights(height: number): [number, number] {
  if (height < 3) {
    return [height, height];
  }
  const third = Math.ceil(height / 3);
  const bar = (height - third) % 2 === 1 ? third + 1 : third;
  const marker = height < 5 ? height : bar + 2 * Math.ceil(Math.floor((height - bar) / 2) / 2);
  return [bar, Math.min(marker, height)];
}
