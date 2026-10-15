// The sky, drawn in a 20x20 box from circles and lines: no icon font needed.
import {Box, Circle, Line, Pixels, Polyline, Rect} from 'react-twinkle';
import type {Point} from 'react-twinkle';
import type {Sky} from '../data/types';
import COLORS from '../theme';

export const ICON_SIZE = 20;

function Sun({x, y, diameter}: {x: number; y: number; diameter: number}) {
  const r = (diameter - 1) / 2;
  const [cx, cy] = [x + r, y + r];
  const rays = Array.from({length: 8}, (unused, i) => {
    const angle = (i / 8) * 2 * Math.PI;
    const at = (length: number): Point => [
      Math.round(cx + length * Math.sin(angle)),
      Math.round(cy - length * Math.cos(angle)),
    ];
    return <Line key={i} from={at(r + 2)} to={at(r + 3)} color={COLORS.sun} />;
  });
  return (
    <>
      <Circle x={x} y={y} diameter={diameter} fill={COLORS.sun} />
      {rays}
    </>
  );
}

function Cloud({y = 4}: {y?: number}) {
  return (
    <>
      <Circle x={2} y={y + 4} diameter={7} fill={COLORS.cloud} />
      <Circle x={6} y={y} diameter={10} fill={COLORS.cloud} />
      <Circle x={11} y={y + 3} diameter={8} fill={COLORS.cloud} />
      <Rect x={5} y={y + 6} width={10} height={5} fill={COLORS.cloud} />
    </>
  );
}

const DROPS: [Point, Point][] = [
  [
    [5, 17],
    [4, 19],
  ],
  [
    [10, 17],
    [9, 19],
  ],
  [
    [15, 17],
    [14, 19],
  ],
];

function Drawing({sky}: {sky: Sky}) {
  switch (sky) {
    case 'clear':
      return <Sun x={5} y={5} diameter={10} />;
    case 'partly':
      return (
        <>
          <Sun x={10} y={2} diameter={7} />
          <Cloud y={6} />
        </>
      );
    case 'fog':
      return [6, 10, 14].map((y) => (
        <Line key={y} from={[2, y]} to={[17, y]} color={COLORS.cloud} />
      ));
    case 'rain':
      return (
        <>
          <Cloud y={2} />
          {DROPS.map(([from, to]) => (
            <Line key={from[0]} from={from} to={to} color={COLORS.rain} />
          ))}
        </>
      );
    case 'snow':
      return (
        <>
          <Cloud y={2} />
          <Pixels
            points={[
              [5, 17],
              [10, 18],
              [15, 17],
              [7, 19],
              [13, 19],
            ]}
            color={COLORS.snow}
          />
        </>
      );
    case 'storm':
      return (
        <>
          <Cloud y={1} />
          <Polyline
            points={[
              [11, 13],
              [8, 16],
              [11, 16],
              [8, 19],
            ]}
            color={COLORS.accent}
          />
        </>
      );
    default:
      return <Cloud />;
  }
}

interface WeatherIconProps {
  x?: number;
  y?: number;
  sky: Sky;
}

export default function WeatherIcon({x = 0, y = 0, sky}: WeatherIconProps) {
  return (
    <Box x={x} y={y} width={ICON_SIZE} height={ICON_SIZE} clip>
      <Drawing sky={sky} />
    </Box>
  );
}
