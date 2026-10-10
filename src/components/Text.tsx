import type {ReactNode} from 'react';
import type {ColorLike} from '../color';
import {DEFAULT_FONT} from '../fonts';
import type {TextAlign, TextBaseline} from '../nodes';

export interface TextProps {
  x?: number;
  y?: number;
  font?: string;
  color?: ColorLike;
  align?: TextAlign;
  baseline?: TextBaseline;
  children?: ReactNode;
}

/**
 * One line of text. `font` is a fixed-width font by its character size
 * ("6x10") or a U8g2 font by name ("helvB08"). `align` says which side of
 * `x` the line is on; `baseline` whether `y` is the line's top or the row
 * its letters stand on.
 */
export default function Text({
  x = 0,
  y = 0,
  font = DEFAULT_FONT,
  color = '#ffffff',
  align = 'left',
  baseline = 'top',
  children = null,
}: TextProps) {
  return (
    <twinkle-text x={x} y={y} font={font} color={color} align={align} baseline={baseline}>
      {children}
    </twinkle-text>
  );
}
