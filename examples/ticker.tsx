// A clock with a seconds bar over a scrolling line: hooks give a component
// the frame it is drawn for.
import {Box, Marquee, Rect, Text, useArea, useNow} from '../src';

export const size = {width: 64, height: 32};
export const seconds = 12;

function Clock() {
  const now = useNow();
  const {width} = useArea();
  const two = (value: number) => String(value).padStart(2, '0');
  return (
    <>
      <Text x={width / 2} y={1} font="9x15" color="#ffffff" align="center">
        {two(now.getHours())}:{two(now.getMinutes())}
      </Text>
      <Rect y={17} width={width} height={1} fill="#2d2d2d" />
      <Rect y={17} width={Math.round((now.getSeconds() / 59) * width)} height={1} fill="#ffaa00" />
    </>
  );
}

export default function Ticker() {
  return (
    <>
      <Clock />
      <Box y={21} width={64} height={10} clip>
        <Marquee font="helvR08" y={8} baseline="alphabetic" color="#50aaff" speed={12}>
          react-twinkle draws React components on LED matrices
        </Marquee>
      </Box>
    </>
  );
}
