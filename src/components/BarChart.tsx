import {barHeights, columns} from '../charts/series';
import type {ColorLike} from '../color';
import {useArea} from '../hooks';
import Rect from './Rect';

export interface BarChartProps {
  /** The series, oldest first. None, or an empty one, draws the flat line. */
  values?: readonly number[];
  /** The bars' colour. */
  color?: ColorLike;
  /** The colour of the latest bar; the others' unless set. */
  last?: ColorLike;
  /** A bar's width in pixels. */
  barWidth?: number;
  /** The pixels between two bars. */
  gap?: number;
  /** The colour of the flat line drawn while there are no values. */
  empty?: ColorLike;
}

/**
 * A series as bars rising from the bottom of the box it is in, which
 * stands for zero (or for the lowest value, when one is negative): as many
 * bars as fit across the box, centred in it, the latest in `last`.
 */
export default function BarChart({
  values = undefined,
  color = '#ffffff',
  last = undefined,
  barWidth = 2,
  gap = 1,
  empty = '#2d2d2d',
}: BarChartProps) {
  const area = useArea();
  if (!values || values.length === 0) {
    return <Rect x={0} y={area.height - 1} width={area.width} height={1} fill={empty} />;
  }
  const wide = Math.min(Math.max(barWidth, 1), Math.max(area.width, 1));
  const count = Math.max(1, Math.floor((area.width + gap) / (wide + gap)));
  const left = Math.trunc((area.width - (count * (wide + gap) - gap)) / 2);
  const heights = barHeights(columns(values, count), area.height);
  return heights.map((height, i) => (
    <Rect
      // The bars are told apart by where they stand.
      // eslint-disable-next-line react/no-array-index-key
      key={i}
      x={left + i * (wide + gap)}
      y={area.height - height}
      width={wide}
      height={height}
      fill={i + 1 === heights.length ? (last ?? color) : color}
    />
  ));
}
