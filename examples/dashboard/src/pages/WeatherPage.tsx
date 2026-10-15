// The weather now, and today's temperature hour by hour.
import {Box, Line, LineChart, Text, useArea, useNow} from 'react-twinkle';
import Header from '../components/Header';
import WeatherIcon from '../components/WeatherIcon';
import {useWeather} from '../data/DataProvider';
import COLORS from '../theme';

const CHART = {x: 2, y: 31, height: 18};
const degrees = (value: number) => `${Math.round(value)}°`;

export default function WeatherPage() {
  const {value: weather, error} = useWeather();
  const {width} = useArea();
  const now = useNow();
  if (!weather) {
    return (
      <>
        <Header title="Weather" />
        <Text
          x={width / 2}
          y={26}
          font="4x6"
          color={error ? COLORS.warn : COLORS.dim}
          align="center"
        >
          {error ? 'NO DATA' : 'LOADING'}
        </Text>
      </>
    );
  }
  const chartWidth = width - 2 * CHART.x;
  // The column of the hour it is now where the weather is, among the day's 24.
  const hour =
    weather.utcOffsetSeconds === undefined
      ? now.getHours()
      : new Date(now.getTime() + weather.utcOffsetSeconds * 1000).getUTCHours();
  const hourX = Math.round((hour / 23) * (chartWidth - 1));
  return (
    <>
      <Header title={weather.place} note={weather.sample ? 'sample' : undefined} />
      <WeatherIcon x={2} y={8} sky={weather.sky} />
      <Text x={width - 2} y={9} font="10x20" color={COLORS.text} align="right">
        {degrees(weather.temperature)}
      </Text>
      <Box x={CHART.x} y={CHART.y} width={chartWidth} height={CHART.height}>
        <Line from={[hourX, 0]} to={[hourX, CHART.height - 1]} color={COLORS.faint} />
        <LineChart values={weather.hourly} color={COLORS.cool} fill={['#50aaff50', '#50aaff00']} />
      </Box>
      <Text x={CHART.x} y={51} font="4x6" color={COLORS.dim}>
        {`L ${degrees(Math.min(...weather.hourly))}`}
      </Text>
      <Text x={width - CHART.x} y={51} font="4x6" color={COLORS.dim} align="right">
        {`H ${degrees(Math.max(...weather.hourly))}`}
      </Text>
    </>
  );
}
