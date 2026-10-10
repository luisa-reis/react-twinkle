import type {ColorLike} from '../color';

export interface RectProps {
  x?: number;
  y?: number;
  width: number;
  height: number;
  fill?: ColorLike;
  stroke?: ColorLike;
  strokeWidth?: number;
}

/**
 * A rectangle, filled, outlined or both. The stroke is centred on the
 * edge: one pixel wide, it is the rectangle's outermost pixels.
 */
export default function Rect({
  x = 0,
  y = 0,
  width,
  height,
  fill = undefined,
  stroke = undefined,
  strokeWidth = 1,
}: RectProps) {
  return (
    <twinkle-rect
      x={x}
      y={y}
      width={width}
      height={height}
      fill={fill}
      stroke={stroke}
      strokeWidth={strokeWidth}
    />
  );
}
