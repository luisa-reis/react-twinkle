// A root: a tree of components and the canvas it is drawn on. `frame`
// draws one frame of it, so the same root serves a live stream, a preview
// and a test alike.
import {useMemo} from 'react';
import type {ReactNode} from 'react';
import type {OpaqueRoot} from 'react-reconciler';
import Canvas from './canvas';
import {toColor} from './color';
import type {Color, ColorLike} from './color';
import {AppContext, AreaContext, FrameContext} from './contexts';
import type {App, FrameValue} from './contexts';
import {Node, ROOT} from './nodes';
import paint from './paint';
import reconciler from './reconciler';

const LEGACY_ROOT = 0;
const BLACK: Color = {r: 0, g: 0, b: 0, a: 255};

/** What a root is made with. */
export interface RootOptions {
  /** The panel, in pixels. */
  width: number;
  height: number;
  /** Frames a second, which is what a frame's time is counted by; ten unless said. */
  fps?: number;
  /** What the canvas is cleared to before each frame; black unless said. */
  background?: ColorLike;
  /** Called when a component ends the app with `useApp().exit(error)`. */
  onExit?: (error?: unknown) => void;
}

/** Which frame `frame()` draws: left out, the one after the last, for now. */
export interface FrameOptions {
  frame?: number;
  now?: Date;
}

interface ProvidersProps {
  frame: FrameValue;
  app: App;
  children?: ReactNode;
}

function Providers({frame, app, children = null}: ProvidersProps) {
  const {width, height} = frame;
  const area = useMemo(() => ({width, height}), [width, height]);
  return (
    <AppContext.Provider value={app}>
      <FrameContext.Provider value={frame}>
        <AreaContext.Provider value={area}>{children}</AreaContext.Provider>
      </FrameContext.Provider>
    </AppContext.Provider>
  );
}

export default class Root {
  width: number;

  height: number;

  fps: number;

  background: Color;

  canvas: Canvas;

  element: ReactNode;

  app: App;

  node: Node;

  dirty: boolean;

  current: FrameValue;

  container: OpaqueRoot;

  error: unknown;

  /**
   * @param width, height the panel, in pixels
   * @param fps frames a second, which is what a frame's time is counted by
   * @param background what the canvas is cleared to before each frame
   */
  constructor(
    // Called with nothing, the check below says what is missing.
    {width, height, fps = 10, background = BLACK, onExit}: RootOptions = {} as RootOptions,
  ) {
    if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1) {
      throw new Error('a root needs a width and a height in pixels');
    }
    this.width = width;
    this.height = height;
    this.fps = Math.max(1, fps);
    this.background = toColor(background);
    this.canvas = new Canvas(width, height);
    this.element = null;
    this.app = {exit: (error) => onExit?.(error)};
    this.node = new Node(ROOT);
    this.dirty = true;
    this.node.onCommit = () => {
      this.dirty = true;
    };
    this.current = this.frameValue(0, new Date());
    const onError = (error: unknown) => {
      this.error = error;
    };
    this.container = reconciler.createContainer(
      this.node,
      LEGACY_ROOT,
      null,
      false,
      null,
      'twinkle',
      onError,
      null,
    );
  }

  frameValue(frame: number, now: Date): FrameValue {
    const {fps, width, height} = this;
    return {frame, fps, now, elapsedMs: Math.floor((frame * 1000) / fps), width, height};
  }

  update(): void {
    const tree = (
      <Providers frame={this.current} app={this.app}>
        {this.element}
      </Providers>
    );
    this.error = undefined;
    reconciler.flushSync(() => reconciler.updateContainer(tree, this.container, null, null));
    reconciler.flushPassiveEffects();
    if (this.error) {
      // What a component threw is thrown again as it is, an Error or not.
      // eslint-disable-next-line @typescript-eslint/no-throw-literal
      throw this.error;
    }
  }

  /** Sets the tree to draw; it is drawn at the next `frame`. */
  render(element: ReactNode): this {
    this.element = element;
    this.update();
    return this;
  }

  /**
   * Draws frame number `frame` for the time `now`, and gives the canvas.
   * Left out, the frame is the one after the last and the time is now.
   */
  frame({frame = this.current.frame + 1, now = new Date()}: FrameOptions = {}): Canvas {
    this.current = this.frameValue(frame, now);
    this.update();
    if (this.dirty) {
      paint(this.node, this.canvas, this.background);
      this.dirty = false;
    }
    return this.canvas;
  }

  unmount(): void {
    this.element = null;
    reconciler.flushSync(() => reconciler.updateContainer(null, this.container, null, null));
  }
}

/** A root for a panel `width` by `height`. */
export function createRoot(options: RootOptions): Root {
  return new Root(options);
}
