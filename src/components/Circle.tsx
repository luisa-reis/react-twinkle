import type {ColorLike} from '../color';

export interface CircleProps {
  x?: number;
  y?: number;
  diameter: number;
  fill?: ColorLike;
  stroke?: ColorLike;
  strokeWidth?: number;
}

/** A circle by its diameter, from the top-left corner of the square around it. */
export default function Circle({
  x = 0,
  y = 0,
  diameter,
  fill = undefined,
  stroke = undefined,
  strokeWidth = 1,
}: CircleProps) {
  return (
    <twinkle-circle
      x={x}
      y={y}
      diameter={diameter}
      fill={fill}
      stroke={stroke}
      strokeWidth={strokeWidth}
    />
  );
}
