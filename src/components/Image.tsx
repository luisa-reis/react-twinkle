export interface ImageProps {
  x?: number;
  y?: number;
  width: number;
  height: number;
  /** RGB or RGBA bytes, row by row. */
  data?: Uint8Array | readonly number[];
  alpha?: number;
}

/**
 * A picture from its bytes, row by row: three a pixel (RGB) or four (RGBA,
 * each pixel blended by its own alpha). `alpha` fades the whole of it.
 */
export default function Image({
  x = 0,
  y = 0,
  width,
  height,
  data = undefined,
  alpha = 1,
}: ImageProps) {
  return <twinkle-image x={x} y={y} width={width} height={height} data={data} alpha={alpha} />;
}
