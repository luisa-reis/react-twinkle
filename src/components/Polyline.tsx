import type {ColorLike} from '../color';
import type {Point} from '../graphics/line';

export interface PolylineProps {
  points: readonly Point[];
  color?: ColorLike;
}

/** A line one pixel wide through `points`, each joint drawn once. */
export default function Polyline({points, color = '#ffffff'}: PolylineProps) {
  return <twinkle-polyline points={points} color={color} />;
}
