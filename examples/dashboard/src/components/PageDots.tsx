// Which page is showing, as a row of short dashes along the bottom.
import {Rect, useArea} from 'react-twinkle';
import COLORS from '../theme';

interface PageDotsProps {
  count: number;
  index: number;
}

const DASH = 3;
const GAP = 2;

export default function PageDots({count, index}: PageDotsProps) {
  const {width, height} = useArea();
  const left = Math.floor((width - (count * DASH + (count - 1) * GAP)) / 2);
  return Array.from({length: count}, (unused, i) => (
    <Rect
      // The dashes never move or reorder.
      // eslint-disable-next-line react/no-array-index-key
      key={i}
      x={left + i * (DASH + GAP)}
      y={height - 2}
      width={DASH}
      height={1}
      fill={i === index ? COLORS.accent : COLORS.faint}
    />
  ));
}
