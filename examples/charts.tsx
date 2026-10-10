// The charts: a line with a dot, an area with a gradient, bars, and a
// bullet chart, each in a box of its own.
import {BarChart, Box, BulletChart, LineChart, Text} from '../src';

export const size = {width: 64, height: 64};

const SERIES = Array.from(
  {length: 48},
  (unused, i) => Math.sin(i / 5) * 3 + Math.sin(i / 1.7) + i / 12,
);

export default function Charts() {
  return (
    <>
      <Text x={1} y={0} font="4x6" color="#6e6e6e">
        LINE
      </Text>
      <Box x={1} y={7} width={30} height={14}>
        <LineChart values={SERIES} color="#50aaff" dot="#ffffff" />
      </Box>
      <Text x={34} y={0} font="4x6" color="#6e6e6e">
        AREA
      </Text>
      <Box x={34} y={7} width={29} height={14}>
        <LineChart values={SERIES} color="#3cdc5a" fill={['#3cdc5a80', '#3cdc5a00']} />
      </Box>
      <Text x={1} y={25} font="4x6" color="#6e6e6e">
        BARS
      </Text>
      <Box x={1} y={32} width={62} height={14}>
        <BarChart values={SERIES} color="#ffaa00" last="#ffffff" barWidth={2} gap={1} />
      </Box>
      <Text x={1} y={50} font="4x6" color="#6e6e6e">
        BULLET
      </Text>
      <Box x={1} y={57} width={62} height={6}>
        <BulletChart value={62} target={80} ranges={[50, 75]} color="#ffaa00" />
      </Box>
    </>
  );
}
