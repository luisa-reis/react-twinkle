import type {ReactNode} from 'react';
import type {ColorLike} from '../color';
import {getFont, DEFAULT_FONT} from '../fonts';
import {useArea, useElapsedMs} from '../hooks';
import type {TextBaseline} from '../nodes';
import Text from './Text';

export interface MarqueeProps {
  y?: number;
  font?: string;
  color?: ColorLike;
  /** Pixels a second. */
  speed?: number;
  /** Pixels between the line's end and its coming round again. */
  gap?: number;
  baseline?: TextBaseline;
  children?: ReactNode;
}

/**
 * One line of text across the box it is in: centred when it fits, and
 * otherwise scrolling left, `speed` pixels a second, coming round again
 * `gap` pixels after its end. `y` is the line's top, or with a U8g2 font
 * and `baseline="alphabetic"` the row its letters stand on.
 */
export default function Marquee({
  y = 0,
  font = DEFAULT_FONT,
  color = '#ffffff',
  speed = 5,
  gap = 12,
  baseline = 'top',
  children = '',
}: MarqueeProps) {
  const {width} = useArea();
  const elapsedMs = useElapsedMs();
  // The children as one string, whether one piece or several.
  const text = ([] as ReactNode[]).concat(children).join('');
  const measured = getFont(font).inkWidth(text);
  if (measured <= width) {
    return (
      <Text
        x={Math.trunc(width / 2)}
        y={y}
        font={font}
        color={color}
        align="center"
        baseline={baseline}
      >
        {text}
      </Text>
    );
  }
  const offset = Math.floor((elapsedMs * speed) / 1000) % (measured + gap);
  return (
    <>
      <Text x={-offset} y={y} font={font} color={color} baseline={baseline}>
        {text}
      </Text>
      <Text x={-offset + measured + gap} y={y} font={font} color={color} baseline={baseline}>
        {text}
      </Text>
    </>
  );
}
