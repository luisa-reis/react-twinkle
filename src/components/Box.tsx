import {useMemo} from 'react';
import type {ReactNode} from 'react';
import type {ColorLike} from '../color';
import {AreaContext} from '../contexts';
import {useArea} from '../hooks';

export interface BoxProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  clip?: boolean;
  background?: ColorLike;
  children?: ReactNode;
}

/**
 * A rectangle of the panel. Its children are drawn in its coordinates,
 * (0, 0) being its top-left corner, and with `clip` nothing they draw
 * shows outside it. Without a size it is as large as the box it is in.
 */
export default function Box({
  x = 0,
  y = 0,
  width = undefined,
  height = undefined,
  clip = false,
  background = undefined,
  children = null,
}: BoxProps) {
  const outer = useArea();
  const w = width ?? outer.width;
  const h = height ?? outer.height;
  const area = useMemo(() => ({width: w, height: h}), [w, h]);
  return (
    <twinkle-box x={x} y={y} width={w} height={h} clip={clip} background={background}>
      <AreaContext.Provider value={area}>{children}</AreaContext.Provider>
    </twinkle-box>
  );
}
