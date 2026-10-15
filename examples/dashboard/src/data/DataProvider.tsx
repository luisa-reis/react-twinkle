// Loads the data once for the whole app, so that a page coming and going
// does not load it again, and gives it to the pages through context.
import {createContext, useContext, useMemo} from 'react';
import type {ReactNode} from 'react';
import type {Sources, SystemStats, Weather} from './types';
import usePolling from './usePolling';
import type {Polled} from './usePolling';

const WEATHER_EVERY_MS = 10 * 60 * 1000;
const SYSTEM_EVERY_MS = 2000;

interface Data {
  weather: Polled<Weather>;
  system: Polled<SystemStats>;
}

const DataContext = createContext<Data>({weather: {}, system: {}});

interface DataProviderProps {
  sources: Sources;
  children: ReactNode;
}

export function DataProvider({sources, children}: DataProviderProps) {
  const weather = usePolling(sources.weather, WEATHER_EVERY_MS);
  const system = usePolling(sources.system, SYSTEM_EVERY_MS);
  const data = useMemo(() => ({weather, system}), [weather, system]);
  return <DataContext.Provider value={data}>{children}</DataContext.Provider>;
}

export function useWeather(): Polled<Weather> {
  return useContext(DataContext).weather;
}

export function useSystem(): Polled<SystemStats> {
  return useContext(DataContext).system;
}
