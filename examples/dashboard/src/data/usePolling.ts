// A value loaded now and again every `everyMs`, the newest kept. A failed
// load keeps the value there was and says why.
import {useEffect, useState} from 'react';

export interface Polled<T> {
  value?: T;
  error?: Error;
}

export default function usePolling<T>(load: () => Promise<T>, everyMs: number): Polled<T> {
  const [polled, setPolled] = useState<Polled<T>>({});
  useEffect(() => {
    let live = true;
    const run = () => {
      load().then(
        (value) => live && setPolled({value}),
        (error: unknown) =>
          live &&
          setPolled((before) => ({
            value: before.value,
            error: error instanceof Error ? error : new Error(String(error)),
          })),
      );
    };
    run();
    const timer = setInterval(run, everyMs);
    return () => {
      live = false;
      clearInterval(timer);
    };
  }, [load, everyMs]);
  return polled;
}
