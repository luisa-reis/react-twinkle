// What the dashboard can be told, from the command line (src/main.tsx).

export interface Place {
  name: string;
  latitude: number;
  longitude: number;
}

export interface Config {
  /** The panel, in pixels. The layout is drawn for 64x64. */
  width: number;
  height: number;
  /** Frames a second. */
  fps: number;
  /** How long each page is shown, in seconds. */
  pageSeconds: number;
  /** Where the weather is for; without one, the weather page shows sample data. */
  place?: Place;
  units: 'celsius' | 'fahrenheit';
  /** The lines the news page scrolls through. */
  messages: string[];
}

export const DEFAULT_CONFIG: Config = {
  width: 64,
  height: 64,
  fps: 20,
  pageSeconds: 10,
  units: 'celsius',
  messages: [
    'Hello from react-twinkle',
    'Edit src/pages to make this dashboard your own',
    'Each page is a React component',
  ],
};
