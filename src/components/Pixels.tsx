import type {ColorLike} from '../color';
import type {Point} from '../graphics/line';

export interface PixelsProps {
  points: readonly Point[];
  color?: ColorLike;
  /** One for every point, in place of `color`. */
  colors?: readonly ColorLike[];
}

/**
 * Single pixels, drawn in order: all in `color`, or each in its own from
 * `colors`, which then has one for every point.
 */
export default function Pixels({points, color = '#ffffff', colors = undefined}: PixelsProps) {
  return <twinkle-pixels points={points} color={color} colors={colors} />;
}
