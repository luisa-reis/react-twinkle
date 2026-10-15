// A clock face with hour, minute and second hands, for the frame's time.
import {Circle, Line, Pixels, useNow} from 'react-twinkle';
import type {Point} from 'react-twinkle';
import COLORS from '../theme';

/**
 * Where a hand from `centre`, `length` long, ends when it has gone
 * `turn` of the way round (0 at twelve o'clock, clockwise).
 */
export function handEnd([cx, cy]: Point, length: number, turn: number): Point {
  const angle = turn * 2 * Math.PI;
  return [Math.round(cx + length * Math.sin(angle)), Math.round(cy - length * Math.cos(angle))];
}

interface AnalogClockProps {
  x?: number;
  y?: number;
  /** Across the face, in pixels; odd, so the face has a middle pixel. */
  diameter: number;
}

export default function AnalogClock({x = 0, y = 0, diameter}: AnalogClockProps) {
  const now = useNow();
  const radius = (diameter - 1) / 2;
  const centre: Point = [x + radius, y + radius];
  const seconds = now.getSeconds();
  const minutes = now.getMinutes() + seconds / 60;
  const hours = (now.getHours() % 12) + minutes / 60;
  const ticks = Array.from({length: 12}, (unused, hour) => handEnd(centre, radius - 2, hour / 12));
  return (
    <>
      <Circle x={x} y={y} diameter={diameter} stroke={COLORS.faint} />
      <Pixels points={ticks} color={COLORS.dim} />
      <Line from={centre} to={handEnd(centre, radius * 0.5, hours / 12)} color={COLORS.text} />
      <Line from={centre} to={handEnd(centre, radius * 0.75, minutes / 60)} color={COLORS.text} />
      <Line from={centre} to={handEnd(centre, radius - 3, seconds / 60)} color={COLORS.accent} />
      <Pixels points={[centre]} color={COLORS.accent} />
    </>
  );
}
