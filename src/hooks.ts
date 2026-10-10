import {useContext} from 'react';
import {AppContext, AreaContext, FrameContext} from './contexts';
import type {App, Area, FrameValue} from './contexts';

/**
 * The frame being drawn: { frame, fps, now, elapsedMs, width, height }. A
 * component that calls it is drawn again every frame.
 */
export function useFrame(): FrameValue {
  return useContext(FrameContext);
}

/** The time the frame is for, a Date. */
export function useNow(): Date {
  return useContext(FrameContext).now;
}

/**
 * Milliseconds since the first frame, counted from the frame number and
 * the rate: what animations go by, so they keep their speed at any rate.
 */
export function useElapsedMs(): number {
  return useContext(FrameContext).elapsedMs;
}

/** The size of the box the component is in, { width, height }. */
export function useArea(): Area {
  return useContext(AreaContext);
}

/** The running app: { exit(error) } ends a `render`. */
export function useApp(): App {
  return useContext(AppContext);
}
