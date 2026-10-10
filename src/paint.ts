// Draws the tree onto a canvas: every node in order, a box's children in
// its coordinates, so what comes later is drawn over what came before.
import type Canvas from './canvas';
import {toColor, scaleAlpha} from './color';
import type {Color, Rgb} from './color';
import {getFont} from './fonts';
import type {Font} from './fonts';
import Surface from './graphics/surface';
import {drawRect} from './graphics/rect';
import type {ShapeStyle} from './graphics/rect';
import {drawCircle} from './graphics/circle';
import {drawLine, drawPolyline} from './graphics/line';
import type {Point} from './graphics/line';
import {BOX, CIRCLE, IMAGE, LINE, PIXELS, POLYLINE, RECT, ROOT, TEXT} from './nodes';
import type {Node, NodeProps, TextAlign} from './nodes';

const DEFAULT_COLOR: Color = {r: 255, g: 255, b: 255, a: 255};

function shape({fill, stroke, strokeWidth}: NodeProps): ShapeStyle {
  return {fill: toColor(fill), stroke: toColor(stroke), strokeWidth};
}

// Where a line of text starts for its alignment about `x`. A fixed-width
// line is placed by its ink, a proportional one by its advance.
function textLeft(font: Font, text: string, x: number, align: TextAlign): number {
  if (align === 'center') {
    return x - Math.trunc(font.inkWidth(text) / 2);
  }
  if (align === 'right') {
    return x - font.inkWidth(text) + (font.kind === 'mono' ? 0 : 1);
  }
  return x;
}

function paintText(surface: Surface, node: Node): void {
  const {x = 0, y = 0, font: name, color, align = 'left', baseline = 'top'} = node.props;
  const font = getFont(name);
  const text = node.text();
  const left = textLeft(font, text, x, align);
  const ink = toColor(color) ?? DEFAULT_COLOR;
  if (font.kind === 'mono') {
    // A 'mono' font says where its baseline is, and any other how far it rises.
    font.draw(
      surface,
      text,
      left,
      baseline === 'alphabetic' ? y - (font.baseline as number) : y,
      ink,
    );
  } else {
    font.draw(
      surface,
      text,
      left,
      baseline === 'alphabetic' ? y : y + (font.ascent as number) + 1,
      ink,
    );
  }
}

function paintPixels(surface: Surface, {points = [], color, colors}: NodeProps): void {
  const one = toColor(color) ?? DEFAULT_COLOR;
  points.forEach(([x, y], i) => surface.set(x, y, colors ? toColor(colors[i]) : one));
}

// A picture's bytes, row-major: three a pixel, or four with its own alpha.
function paintImage(
  surface: Surface,
  {x = 0, y = 0, width, height, data, alpha = 1}: NodeProps,
): void {
  if (!data || !width || !height) {
    return;
  }
  const channels = data.length / (width * height);
  if (channels !== 3 && channels !== 4) {
    throw new Error(
      `an image ${width}x${height} takes ${width * height * 3} or ${width * height * 4} bytes`,
    );
  }
  for (let row = 0; row < height; row += 1) {
    for (let col = 0; col < width; col += 1) {
      const i = (row * width + col) * channels;
      const pixel = {
        r: data[i],
        g: data[i + 1],
        b: data[i + 2],
        a: channels === 4 ? data[i + 3] : 255,
      };
      surface.set(x + col, y + row, alpha === 1 ? pixel : scaleAlpha(pixel, alpha));
    }
  }
}

function paintNode(surface: Surface, node: Node): void {
  const {props} = node;
  if (node.hidden) {
    return;
  }
  switch (node.type) {
    case ROOT:
      node.children.forEach((child) => paintNode(surface, child));
      break;
    case BOX: {
      const {x = 0, y = 0, width = 0, height = 0, clip = false, background} = props;
      const inner = surface.child(x, y, width, height, clip);
      if (background) {
        drawRect(inner, {x: 0, y: 0, width, height}, {fill: toColor(background)});
      }
      node.children.forEach((child) => paintNode(inner, child));
      break;
    }
    case TEXT:
      paintText(surface, node);
      break;
    case RECT: {
      const {x = 0, y = 0, width = 0, height = 0} = props;
      drawRect(surface, {x, y, width, height}, shape(props));
      break;
    }
    case CIRCLE: {
      const {x = 0, y = 0, diameter = 0} = props;
      drawCircle(surface, {x, y, diameter}, shape(props));
      break;
    }
    case LINE:
      // A line has both its ends: `Line` asks for them.
      drawLine(
        surface,
        props.from as Point,
        props.to as Point,
        toColor(props.color) ?? DEFAULT_COLOR,
      );
      break;
    case POLYLINE:
      drawPolyline(surface, props.points ?? [], toColor(props.color) ?? DEFAULT_COLOR);
      break;
    case PIXELS:
      paintPixels(surface, props);
      break;
    case IMAGE:
      paintImage(surface, props);
      break;
    default:
      break;
  }
}

/** Clears the canvas to `background` and draws the tree under `root` on it. */
export default function paint(root: Node, canvas: Canvas, background?: Rgb): void {
  canvas.clear(background);
  paintNode(new Surface(canvas), root);
}
