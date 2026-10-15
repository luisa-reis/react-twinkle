// The two kinds of sources: live (the network and this machine) and demo
// (fixed samples, for snapshots, tests and running without a network).
import os from 'node:os';
import type {Config} from '../config';
import type {Sources, SystemStats, Weather} from './types';
import {fetchWeather} from './weather';

// A mild day, warmest mid-afternoon.
const SAMPLE_HOURLY = Array.from(
  {length: 24},
  (unused, hour) => Math.round(10 * (15 + 6 * Math.sin(((hour - 9) / 24) * 2 * Math.PI))) / 10,
);

export const SAMPLE_WEATHER: Weather = {
  place: 'Weather',
  temperature: 19.5,
  sky: 'partly',
  hourly: SAMPLE_HOURLY,
  sample: true,
};

/** How many samples of the load the history keeps. */
export const HISTORY = 30;

export const SAMPLE_SYSTEM: SystemStats = {
  load: [0.42, 0.37, 0.3],
  memory: 0.63,
  uptimeSeconds: 3 * 86400 + 4 * 3600,
  // A busy spell, settling down.
  loadHistory: Array.from(
    {length: HISTORY},
    (unused, i) =>
      Math.round(100 * (0.3 + 0.25 * Math.sin(i / 3) + 0.2 * Math.exp(-((i - 12) ** 2) / 20))) /
      100,
  ),
};

/** This machine's load and memory, sampled each time it is called. */
function systemSampler(): () => SystemStats {
  const history: number[] = [];
  return () => {
    const cpus = Math.max(os.cpus().length, 1);
    const [one, five, fifteen] = os.loadavg().map((load) => load / cpus);
    history.push(one);
    history.splice(0, history.length - HISTORY);
    return {
      load: [one, five, fifteen],
      memory: 1 - os.freemem() / os.totalmem(),
      uptimeSeconds: os.uptime(),
      loadHistory: [...history],
    };
  };
}

export function liveSources(config: Config): Sources {
  const {place, units} = config;
  const sample = systemSampler();
  return {
    weather: () =>
      place
        ? fetchWeather(place, units, AbortSignal.timeout(10_000))
        : Promise.resolve(SAMPLE_WEATHER),
    system: async () => sample(),
  };
}

export const demoSources: Sources = {
  weather: async () => SAMPLE_WEATHER,
  system: async () => SAMPLE_SYSTEM,
};
