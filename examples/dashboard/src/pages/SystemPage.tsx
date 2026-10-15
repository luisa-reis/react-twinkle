// This machine: load as it was over the last minute, memory, uptime.
import {BarChart, Box, BulletChart, Text, useArea} from 'react-twinkle';
import Header from '../components/Header';
import {useSystem} from '../data/DataProvider';
import {HISTORY} from '../data/sources';
import COLORS from '../theme';

function uptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return days > 0 ? `UP ${days}D ${hours}H` : `UP ${hours}H ${minutes}M`;
}

export default function SystemPage() {
  const {value: stats} = useSystem();
  const {width} = useArea();
  if (!stats) {
    return <Header title="System" />;
  }
  const {
    load: [load],
    loadHistory,
  } = stats;
  const memory = Math.round(stats.memory * 100);
  // The newest sample at the right, the history filling in from there.
  const history = [...Array<number>(HISTORY - loadHistory.length).fill(0), ...loadHistory];
  // A full history fills the width: a bar and a gap a sample.
  const barWidth = Math.max(Math.floor((width - 2) / HISTORY) - 1, 1);
  return (
    <>
      <Header title="System" note={uptime(stats.uptimeSeconds)} />
      <Text x={1} y={9} font="4x6" color={COLORS.dim}>
        LOAD
      </Text>
      <Text
        x={width - 1}
        y={8}
        font="5x7"
        color={load > 0.8 ? COLORS.warn : COLORS.text}
        align="right"
      >
        {load.toFixed(2)}
      </Text>
      <Box x={1} y={17} width={width - 2} height={16}>
        <BarChart
          values={history}
          color={COLORS.cool}
          last={COLORS.accent}
          barWidth={barWidth}
          gap={1}
          empty={COLORS.faint}
        />
      </Box>
      <Text x={1} y={38} font="4x6" color={COLORS.dim}>
        MEMORY
      </Text>
      <Text x={width - 1} y={38} font="4x6" color={COLORS.text} align="right">
        {`${memory}%`}
      </Text>
      <Box x={1} y={45} width={width - 2} height={6}>
        <BulletChart
          value={memory}
          target={85}
          max={100}
          ranges={[60, 85]}
          color={memory > 85 ? COLORS.warn : COLORS.good}
          marker={COLORS.text}
        />
      </Box>
    </>
  );
}
