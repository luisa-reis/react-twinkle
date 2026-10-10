// A few of the fonts, each line saying its own name.
import {Text} from '../src';

export const size = {width: 128, height: 64};

const LINES = [
  ['4x6', '#6e6e6e'],
  ['6x10', '#ffffff'],
  ['9x15', '#ffaa00'],
  ['micro', '#6e6e6e'],
  ['helvR08', '#ffffff'],
  ['ncenB10', '#50aaff'],
  ['profont12', '#3cdc5a'],
  ['fub14', '#ff5050'],
];

export default function Fonts() {
  let y = 2;
  return LINES.map(([font, color], i) => {
    const column = i < 4 ? 2 : 62;
    if (i === 4) {
      y = 2;
    }
    const top = y;
    y += [8, 11, 16, 8, 11, 13, 13, 20][i];
    return (
      <Text key={font} x={column} y={top} font={font} color={color}>
        {font}
      </Text>
    );
  });
}
