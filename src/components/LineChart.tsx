import {columns} from '../charts/series';
import {mix, roundHalfAway, toColor} from '../color';
import type {Color, ColorLike} from '../color';
import type {Point} from '../graphics/line';
import {useArea} from '../hooks';
import Pixels from './Pixels';
import Polyline from './Polyline';
import Rect from './Rect';

export interface LineChartProps {
  /** The series, oldest first. None, or an empty one, draws the flat line. */
  values?: readonly number[];
  /** The line's colour. */
  color?: ColorLike;
  /**
   * Fills what is under the line, down to the bottom of the box: the
   * colour on the box's top row and the one on its bottom row, with a
   * gradient between when they differ.
   */
  fill?: readonly [ColorLike, ColorLike];
  /** Draws a dot three pixels across on the latest value, in this colour. */
  dot?: ColorLike;
  /** The colour of the flat line drawn while there are no values. */
  empty?: ColorLike;
}

/**
 * A series as a line across the box it is in, its lowest value on the
 * bottom row and its highest on the top one. More values than there are
 * columns are averaged, fewer are joined by straight lines. With `fill`
 * it is an area chart.
 */
export default function LineChart({
  values = undefined,
  color = '#ffffff',
  fill = undefined,
  dot = undefined,
  empty = '#2d2d2d',
}: LineChartProps) {
  const {width, height} = useArea();
  if (!values || values.length === 0) {
    return <Rect x={0} y={Math.trunc(height / 2)} width={width} height={1} fill={empty} />;
  }
  // The dot is three pixels across, so with one the line keeps a pixel
  // clear of every edge.
  const pad = dot ? 1 : 0;
  const cols = Math.max(1, width - 2 * pad);
  const rows = Math.max(1, height - 2 * pad);
  const fitted = columns(values, cols);
  const low = Math.min(...fitted);
  const high = Math.max(...fitted);
  const points = fitted.map((value, i): Point => {
    const up = high > low ? (value - low) / (high - low) : 0.5;
    return [pad + i, pad + roundHalfAway((1 - up) * (rows - 1))];
  });
  let under = null;
  if (fill) {
    const [top, bottom] = [toColor(fill[0]), toColor(fill[1])];
    const cells: Point[] = [];
    const colors: Color[] = [];
    points.forEach(([x, y]) => {
      for (let row = y + 1; row < height; row += 1) {
        cells.push([x, row]);
        colors.push(mix(top, bottom, Math.fround(row / Math.max(height - 1, 1))));
      }
    });
    under = <Pixels points={cells} colors={colors} />;
  }
  const [endX, endY] = points[points.length - 1];
  return (
    <>
      {under}
      {points.length === 1 ? (
        <Pixels points={points} color={color} />
      ) : (
        <Polyline points={points} color={color} />
      )}
      {dot && <Rect x={endX - 1} y={endY - 1} width={3} height={3} fill={dot} />}
    </>
  );
}
