// The configured messages, each scrolling along its own line.
import {Box, Marquee, Text, useArea, useNow} from 'react-twinkle';
import Header from '../components/Header';
import COLORS from '../theme';

const LINE_COLORS = [COLORS.text, COLORS.cool, COLORS.good];
const two = (value: number) => String(value).padStart(2, '0');

interface NewsPageProps {
  messages: string[];
}

export default function NewsPage({messages}: NewsPageProps) {
  const {width} = useArea();
  const now = useNow();
  return (
    <>
      <Header title="News" />
      <Text x={width / 2} y={9} font="9x15" color={COLORS.accent} align="center">
        {`${two(now.getHours())}:${two(now.getMinutes())}`}
      </Text>
      {messages.slice(0, 3).map((message, i) => (
        <Box key={message} y={28 + i * 9} width={width} height={8} clip>
          <Marquee font="5x7" color={LINE_COLORS[i]} speed={10 + 4 * i}>
            {message}
          </Marquee>
        </Box>
      ))}
    </>
  );
}
