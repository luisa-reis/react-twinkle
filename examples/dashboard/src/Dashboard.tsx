// The app: its pages, one after another, each sliding in over the last,
// with the data loaded once for all of them.
import {Box, useArea, useElapsedMs} from 'react-twinkle';
import type {ReactElement} from 'react';
import PageDots from './components/PageDots';
import type {Config} from './config';
import {DataProvider} from './data/DataProvider';
import type {Sources} from './data/types';
import ClockPage from './pages/ClockPage';
import NewsPage from './pages/NewsPage';
import SystemPage from './pages/SystemPage';
import WeatherPage from './pages/WeatherPage';

/** How long a page takes to slide in, in milliseconds. */
export const SLIDE_MS = 400;
/** Rows kept free at the bottom for the page dashes. */
const FOOTER = 4;

const easeOut = (t: number) => 1 - (1 - t) ** 3;

interface Page {
  name: string;
  element: ReactElement;
}

interface PagerProps {
  pages: Page[];
  pageSeconds: number;
}

/**
 * Which page is showing is a function of the time since the start, as
 * everything drawn is, so a frame can be drawn again exactly.
 */
export function Pager({pages, pageSeconds}: PagerProps) {
  const elapsed = useElapsedMs();
  const {width, height} = useArea();
  const pageMs = pageSeconds * 1000;
  const shown = Math.floor(elapsed / pageMs);
  const index = shown % pages.length;
  const into = elapsed % pageMs;
  const sliding = shown > 0 && into < SLIDE_MS;
  const offset = sliding ? Math.round(width * (1 - easeOut(into / SLIDE_MS))) : 0;
  const visible = sliding
    ? [
        {page: pages[(index + pages.length - 1) % pages.length], x: offset - width},
        {page: pages[index], x: offset},
      ]
    : [{page: pages[index], x: 0}];
  return (
    <>
      {visible.map(({page: {name, element}, x}) => (
        <Box key={name} x={x} width={width} height={height - FOOTER} clip>
          {element}
        </Box>
      ))}
      <PageDots count={pages.length} index={index} />
    </>
  );
}

interface DashboardProps {
  config: Config;
  sources: Sources;
}

export default function Dashboard({config, sources}: DashboardProps) {
  const {messages, pageSeconds} = config;
  const pages: Page[] = [
    {name: 'clock', element: <ClockPage />},
    {name: 'weather', element: <WeatherPage />},
    {name: 'system', element: <SystemPage />},
    {name: 'news', element: <NewsPage messages={messages} />},
  ];
  return (
    <DataProvider sources={sources}>
      <Pager pages={pages} pageSeconds={pageSeconds} />
    </DataProvider>
  );
}
