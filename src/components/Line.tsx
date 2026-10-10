import type {ColorLike} from '../color';
import type {Point} from '../graphics/line';

export interface LineProps {
  from: Point;
  to: Point;
  color?: ColorLike;
}

/** A line one pixel wide between two pixels, both drawn. */
export default function Line({from, to, color = '#ffffff'}: LineProps) {
  return <twinkle-line from={from} to={to} color={color} />;
}
