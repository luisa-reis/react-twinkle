// `render`, as Ink has it: mounts a tree and keeps drawing it, here one
// frame after another at a steady rate, each sent to an output.
import type {ReactNode} from 'react';
import type Canvas from './canvas';
import Root from './root';
import type {RootOptions} from './root';

/** Where frames go: anything with `send(rgb)`, such as a DdpOutput. */
export interface Output {
  /** Takes one frame, the canvas's RGB bytes. */
  send(rgb: Uint8Array): void;
  /** Called at the end, and waited for when it gives a promise. */
  close?(): unknown;
}

/** What `render` takes: a root's options, and where and how long to stream. */
export interface RenderOptions extends Omit<RootOptions, 'onExit'> {
  /** Where frames go; `close()` is called at the end when it has one. */
  output?: Output;
  /** Stop after this many frames; otherwise run until `unmount`. */
  frames?: number;
  /**
   * Called with (canvas, frame) after each is drawn; returning false keeps
   * that frame from being sent.
   */
  onFrame?: (canvas: Canvas, frame: number) => unknown;
}

/** What `render` gives: the running app. */
export interface Instance {
  /** The canvas the frames are drawn on. */
  canvas: Canvas;
  /** Draws another tree in place of the first. */
  rerender(next: ReactNode): Root;
  /** Stops drawing and closes the output. */
  unmount(): void;
  /** Settles when the app has stopped: rejected with the error that stopped it. */
  waitUntilExit(): Promise<void>;
}

/**
 * Draws `element` on a panel and streams it.
 *
 * @param options.width, options.height the panel, in pixels
 * @param options.fps frames a second; ten unless said
 * @param options.output where frames go: anything with `send(rgb)`, such as
 *   a DdpOutput; `close()` is called at the end when it has one
 * @param options.frames stop after this many; otherwise run until `unmount`
 * @param options.onFrame called with (canvas, frame) after each is drawn;
 *   returning false keeps that frame from being sent
 * @returns { canvas, rerender, unmount, waitUntilExit }
 */
export default function render(
  element: ReactNode,
  // Called with nothing, the root says what it needs.
  options: RenderOptions = {} as RenderOptions,
): Instance {
  const {output, frames, onFrame, ...rootOptions} = options;
  let finish: () => void;
  let fail: (error: unknown) => void;
  const exited = new Promise<void>((resolve, reject) => {
    finish = resolve;
    fail = reject;
  });
  let timer: ReturnType<typeof setTimeout>;
  let stopped = false;
  let root: Root;

  const stop = (error?: unknown) => {
    if (stopped) {
      return;
    }
    stopped = true;
    clearTimeout(timer);
    root.unmount();
    Promise.resolve(output?.close?.()).then(() => (error ? fail(error) : finish()));
  };

  root = new Root({...rootOptions, onExit: stop});
  root.render(element);
  const period = 1000 / root.fps;
  const start = Date.now();
  let frame = 0;

  // Paced from the start time, so the cost of drawing does not slow the rate.
  const tick = () => {
    if (stopped) {
      return;
    }
    try {
      const canvas = root.frame({frame, now: new Date()});
      if (onFrame?.(canvas, frame) !== false) {
        output?.send(canvas.px);
      }
    } catch (error) {
      stop(error);
      return;
    }
    frame += 1;
    if (frames !== undefined && frame >= frames) {
      stop();
      return;
    }
    timer = setTimeout(tick, Math.max(0, start + frame * period - Date.now()));
  };
  timer = setTimeout(tick, 0);

  return {
    canvas: root.canvas,
    rerender: (next) => root.render(next),
    unmount: () => stop(),
    waitUntilExit: () => exited,
  };
}
