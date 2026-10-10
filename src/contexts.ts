import {createContext} from 'react';

/** What `useFrame()` gives: the frame being drawn. */
export interface FrameValue {
  /** The frame's number, from 0. */
  frame: number;
  /** Frames a second. */
  fps: number;
  /** The time the frame is for. */
  now: Date;
  /** Milliseconds since the first frame, counted from `frame` and `fps`. */
  elapsedMs: number;
  /** The panel's size, in pixels. */
  width: number;
  height: number;
}

/** What `useArea()` gives: a size in pixels. */
export interface Area {
  width: number;
  height: number;
}

/** What `useApp()` gives. */
export interface App {
  /** Ends a `render`, with the error that ended it when there is one. */
  exit(error?: unknown): void;
}

/**
 * The frame being drawn: its number, the rate, the time it is for, and the
 * panel's size. It changes every frame, so what reads it is drawn again.
 */
export const FrameContext = createContext<FrameValue>({
  frame: 0,
  fps: 10,
  now: new Date(0),
  elapsedMs: 0,
  width: 0,
  height: 0,
});

/** The size of the box a component is in: the panel's, outside any box. */
export const AreaContext = createContext<Area>({width: 0, height: 0});

/** What a running app can do to itself. */
export const AppContext = createContext<App>({exit() {}});
