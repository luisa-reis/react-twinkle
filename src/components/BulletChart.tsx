import {bulletHeights} from '../charts/series';
import {roundHalfAway, scaleAlpha, toColor} from '../color';
import type {ColorLike} from '../color';
import {useArea} from '../hooks';
import Rect from './Rect';

/**
 * The alpha of the bands against their colour: the first the strongest,
 * as the darkest is in print.
 */
const BAND_ALPHAS = [0.55, 0.38, 0.26, 0.18, 0.12];

export interface BulletChartProps {
  /** The value the bar reaches. Without one, or a number, there is no bar. */
  value?: number;
  /** Where the marker stands; none unless set. */
  target?: number;
  /** The values at the left and the right end of the scale. */
  min?: number;
  max?: number;
  /**
   * Where one band ends and the next begins, ascending: `[60, 85]` makes
   * three bands, to 60, to 85 and to `max`. None is one band.
   */
  ranges?: readonly number[];
  /** The bar's colour. */
  color?: ColorLike;
  /** The marker's colour. */
  marker?: ColorLike;
  /** The bands' colour, strongest in the first band and fainter in each after. */
  band?: ColorLike;
}

/**
 * A bullet graph, after Stephen Few, across the box it is in: the bands
 * over its whole height, each to where the next range begins; the bar
 * from the left to the value; and a marker at the target.
 */
export default function BulletChart({
  value = undefined,
  target = undefined,
  min = 0,
  max = 100,
  ranges = [],
  color = '#ffffff',
  marker = '#ffffff',
  band = '#6e6e6e',
}: BulletChartProps) {
  const {width, height} = useArea();
  // How far along the box a value is, in pixels from its left.
  const along = (v: number) => {
    const part = Math.min(Math.max((v - min) / (max - min), 0), 1);
    return roundHalfAway((Number.isNaN(part) ? 0 : part) * width);
  };
  const bandColor = toColor(band);
  let from = 0;
  const bands = [...ranges, max].map((end, i) => {
    const to = along(end);
    const start = from;
    from = to;
    const alpha = BAND_ALPHAS[Math.min(i, BAND_ALPHAS.length - 1)];
    return (
      <Rect
        key={end}
        x={start}
        width={Math.max(0, to - start)}
        height={height}
        fill={scaleAlpha(bandColor, alpha)}
      />
    );
  });
  const [barHeight, markerHeight] = bulletHeights(height);
  // The marker is two pixels wide where there is room, and never off the end.
  const thick = width >= 40 ? 2 : 1;
  return (
    <>
      {bands}
      {value !== undefined && Number.isFinite(value) && (
        <Rect
          y={Math.floor((height - barHeight) / 2)}
          width={along(value)}
          height={barHeight}
          fill={color}
        />
      )}
      {target !== undefined && (
        <Rect
          x={Math.min(
            Math.max(0, along(target) - Math.floor(thick / 2)),
            Math.max(0, width - thick),
          )}
          y={Math.floor((height - markerHeight) / 2)}
          width={thick}
          height={markerHeight}
          fill={marker}
        />
      )}
    </>
  );
}
