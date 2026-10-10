// The tree React builds: host nodes, each one of the element types below
// with its props and children, and the strings inside a text node.

import type {Attributes, ReactNode} from 'react';
import type {ColorLike} from './color';
import type {Point} from './graphics/line';

export const BOX = 'twinkle-box';
export const TEXT = 'twinkle-text';
export const RECT = 'twinkle-rect';
export const CIRCLE = 'twinkle-circle';
export const LINE = 'twinkle-line';
export const POLYLINE = 'twinkle-polyline';
export const PIXELS = 'twinkle-pixels';
export const IMAGE = 'twinkle-image';
export const ROOT = 'twinkle-root';
export const STRING = '#text';

/** Which side of its `x` a line of text is on. */
export type TextAlign = 'left' | 'center' | 'right';

/** Whether a line's `y` is its top or the row its letters stand on. */
export type TextBaseline = 'top' | 'alphabetic';

// What each host element takes. The components give every prop; left out,
// a prop has the default `paint` gives it.

export interface BoxElementProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  clip?: boolean;
  background?: ColorLike;
}

export interface TextElementProps {
  x?: number;
  y?: number;
  font?: string;
  color?: ColorLike;
  align?: TextAlign;
  baseline?: TextBaseline;
}

export interface RectElementProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  fill?: ColorLike;
  stroke?: ColorLike;
  strokeWidth?: number;
}

export interface CircleElementProps {
  x?: number;
  y?: number;
  diameter?: number;
  fill?: ColorLike;
  stroke?: ColorLike;
  strokeWidth?: number;
}

export interface LineElementProps {
  from: Point;
  to: Point;
  color?: ColorLike;
}

export interface PolylineElementProps {
  points?: readonly Point[];
  color?: ColorLike;
}

export interface PixelsElementProps {
  points?: readonly Point[];
  color?: ColorLike;
  colors?: readonly ColorLike[];
}

export interface ImageElementProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  data?: Uint8Array | readonly number[];
  alpha?: number;
}

/** The host elements by name, each with its props. */
export interface HostElements {
  [BOX]: BoxElementProps;
  [TEXT]: TextElementProps;
  [RECT]: RectElementProps;
  [CIRCLE]: CircleElementProps;
  [LINE]: LineElementProps;
  [POLYLINE]: PolylineElementProps;
  [PIXELS]: PixelsElementProps;
  [IMAGE]: ImageElementProps;
}

/** The name of a host element. */
export type HostType = keyof HostElements;

/** What a node is: a host element, the root, or a string. */
export type NodeType = HostType | typeof ROOT | typeof STRING;

/**
 * The props a node keeps: its element's, without the children. Each type
 * of node reads its own.
 */
export type NodeProps = Partial<
  BoxElementProps &
    TextElementProps &
    RectElementProps &
    CircleElementProps &
    LineElementProps &
    PolylineElementProps &
    PixelsElementProps &
    ImageElementProps
>;

/** The host elements as JSX takes them: each with a key, two with children. */
export interface HostIntrinsicElements {
  'twinkle-box': BoxElementProps & Attributes & {children?: ReactNode};
  'twinkle-text': TextElementProps & Attributes & {children?: ReactNode};
  'twinkle-rect': RectElementProps & Attributes;
  'twinkle-circle': CircleElementProps & Attributes;
  'twinkle-line': LineElementProps & Attributes;
  'twinkle-polyline': PolylineElementProps & Attributes;
  'twinkle-pixels': PixelsElementProps & Attributes;
  'twinkle-image': ImageElementProps & Attributes;
}

// Tells JSX of the host elements, so the components check.
declare module 'react' {
  namespace JSX {
    interface IntrinsicElements extends HostIntrinsicElements {}
  }
}

const TYPES: HostType[] = [BOX, TEXT, RECT, CIRCLE, LINE, POLYLINE, PIXELS, IMAGE];

export class Node {
  type: NodeType;

  props: NodeProps;

  children: Node[];

  parent: Node | undefined;

  value: string;

  onCommit: (() => void) | undefined;

  hidden: boolean;

  constructor(type: NodeType, props: NodeProps = {}) {
    this.type = type;
    this.props = props;
    this.children = [];
    this.parent = undefined;
    /** For a string: what it says. */
    this.value = '';
    /** For the root: called when the tree has changed. */
    this.onCommit = undefined;
    /** Set while React keeps the node out of sight, under a Suspense. */
    this.hidden = false;
  }

  setProps(props: NodeProps): void {
    this.props = props;
  }

  setValue(value: string): void {
    this.value = value;
  }

  setHidden(hidden: boolean): void {
    this.hidden = hidden;
  }

  append(child: Node): void {
    child.detach();
    this.children.push(child);
    child.adopt(this);
  }

  insertBefore(child: Node, before: Node): void {
    child.detach();
    const at = this.children.indexOf(before);
    this.children.splice(at < 0 ? this.children.length : at, 0, child);
    child.adopt(this);
  }

  remove(child: Node): void {
    const at = this.children.indexOf(child);
    if (at >= 0) {
      this.children.splice(at, 1);
      child.adopt(undefined);
    }
  }

  adopt(parent: Node | undefined): void {
    this.parent = parent;
  }

  detach(): void {
    if (this.parent) {
      this.parent.remove(this);
    }
  }

  /** The strings under this node, joined: what a text node says. */
  text(): string {
    if (this.hidden) {
      return '';
    }
    return this.type === STRING ? this.value : this.children.map((child) => child.text()).join('');
  }
}

export function createNode(type: HostType, props: NodeProps): Node {
  if (!TYPES.includes(type)) {
    throw new Error(`<${type}> is not something react-twinkle draws`);
  }
  return new Node(type, props);
}

export function createString(value: string): Node {
  const node = new Node(STRING);
  node.value = value;
  return node;
}
