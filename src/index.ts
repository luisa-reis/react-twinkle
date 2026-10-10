// react-twinkle: React components drawn into a pixel canvas, for LED
// matrices, the way Ink draws them into a terminal.
export {default as render} from './render';
export type {Instance, Output, RenderOptions} from './render';
export {default as Root, createRoot} from './root';
export type {FrameOptions, RootOptions} from './root';
export {default as Canvas} from './canvas';

export {default as Box} from './components/Box';
export type {BoxProps} from './components/Box';
export {default as Text} from './components/Text';
export type {TextProps} from './components/Text';
export {default as Rect} from './components/Rect';
export type {RectProps} from './components/Rect';
export {default as Circle} from './components/Circle';
export type {CircleProps} from './components/Circle';
export {default as Line} from './components/Line';
export type {LineProps} from './components/Line';
export {default as Polyline} from './components/Polyline';
export type {PolylineProps} from './components/Polyline';
export {default as Pixels} from './components/Pixels';
export type {PixelsProps} from './components/Pixels';
export {default as Image} from './components/Image';
export type {ImageProps} from './components/Image';
export {default as BarChart} from './components/BarChart';
export type {BarChartProps} from './components/BarChart';
export {default as BulletChart} from './components/BulletChart';
export type {BulletChartProps} from './components/BulletChart';
export {default as LineChart} from './components/LineChart';
export type {LineChartProps} from './components/LineChart';
export {default as Marquee} from './components/Marquee';
export type {MarqueeProps} from './components/Marquee';
export type {
  BoxElementProps,
  CircleElementProps,
  HostElements,
  HostIntrinsicElements,
  ImageElementProps,
  LineElementProps,
  PixelsElementProps,
  PolylineElementProps,
  RectElementProps,
  TextAlign,
  TextBaseline,
  TextElementProps,
} from './nodes';

export {useApp, useArea, useElapsedMs, useFrame, useNow} from './hooks';
export type {App, Area, FrameValue} from './contexts';

export {
  BLACK,
  WHITE,
  formatColor,
  mix,
  parseColor,
  rgb,
  rgba,
  roundHalfAway,
  scaleAlpha,
  toColor,
} from './color';
export type {Color, ColorLike, Rgb} from './color';
export {
  DEFAULT_FONT,
  clearFonts,
  fontNames,
  getFont,
  measureText,
  registerFont,
  registerMonoFont,
  registerU8g2Font,
  setDefaultFont,
} from './fonts';
export type {Font, FontExtent} from './fonts';
export {default as MonoFont} from './fonts/mono';
export type {MonoFontDescription} from './fonts/mono';
export {default as U8g2Font} from './fonts/u8g2';
export type {U8g2Glyph} from './fonts/u8g2';
export {barHeights, bulletHeights, columns} from './charts/series';
export {circleOutline} from './graphics/circle';
export type {CircleGeometry} from './graphics/circle';
export {linePoints, polylinePoints} from './graphics/line';
export type {Point} from './graphics/line';
export type {default as Surface, Clip} from './graphics/surface';

export {
  default as DdpOutput,
  chunks as ddpChunks,
  packets as ddpPackets,
  parseTarget,
} from './output/ddp';
export type {DdpTarget} from './output/ddp';
export {animationParts, encodeApng, encodePng, scaleUp} from './output/png';
export type {AnimationPart, Picture} from './output/png';
