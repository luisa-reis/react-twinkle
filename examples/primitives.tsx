// Every primitive on one 64x64 panel.
import {Box, Circle, Image, Line, Pixels, Polyline, Rect, Text} from '../src';

// A small picture from its bytes: a red-to-blue ramp, four bytes a pixel.
const ramp = Uint8Array.from({length: 12 * 8 * 4}, (unused, i) => {
  const x = Math.floor(i / 4) % 12;
  return [255 - x * 20, 40, x * 20, 255][i % 4];
});

export const size = {width: 64, height: 64};

export default function Primitives() {
  return (
    <>
      <Text x={32} y={1} font="5x8" color="#ffaa00" align="center">
        TWINKLE
      </Text>
      <Rect x={2} y={12} width={18} height={12} stroke="#6e6e6e" />
      <Rect x={4} y={14} width={14} height={8} fill="#3cdc5a" />
      <Circle x={24} y={11} diameter={14} fill="#50aaff" stroke="#ffffff" />
      <Line from={[42, 12]} to={[61, 23]} color="#ff5050" />
      <Line from={[42, 23]} to={[61, 12]} color="#ff5050" />
      <Polyline
        points={[
          [2, 40],
          [10, 30],
          [18, 37],
          [26, 28],
          [34, 34],
        ]}
        color="#ffaa00"
      />
      <Pixels
        points={[
          [40, 30],
          [42, 32],
          [44, 30],
          [46, 32],
          [48, 30],
        ]}
        color="#ffffff"
      />
      <Image x={50} y={28} width={12} height={8} data={ramp} />
      <Box x={2} y={44} width={60} height={18} clip background="#101828">
        <Circle x={40} y={-10} diameter={36} fill="#ffffff20" />
        <Text x={2} y={2} font="helvB08" color="#ffffff">
          Box clips
        </Text>
      </Box>
    </>
  );
}
