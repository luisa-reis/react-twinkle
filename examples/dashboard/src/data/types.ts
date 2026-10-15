// What the pages show, as plain data. Where it comes from is in sources.ts.

export type Sky = 'clear' | 'partly' | 'cloudy' | 'fog' | 'rain' | 'snow' | 'storm';

export interface Weather {
  place: string;
  /** Now, in the configured unit. */
  temperature: number;
  sky: Sky;
  /** Today's temperature hour by hour, from midnight where the weather is. */
  hourly: number[];
  /** Where the weather is, its offset from UTC; left out, this machine's. */
  utcOffsetSeconds?: number;
  /** True when this is made-up data, not a forecast. */
  sample: boolean;
}

export interface SystemStats {
  /** Load averages over 1, 5 and 15 minutes, per CPU. */
  load: [number, number, number];
  /** The share of memory in use, 0 to 1. */
  memory: number;
  uptimeSeconds: number;
  /** The 1-minute load of the latest samples, oldest first. */
  loadHistory: number[];
}

/** Where the data comes from: the network and this machine, or fixed samples. */
export interface Sources {
  weather(): Promise<Weather>;
  system(): Promise<SystemStats>;
}
