// The time, as hands and as digits, and the date.
import {Text, useArea, useNow} from 'react-twinkle';
import AnalogClock from '../components/AnalogClock';
import COLORS from '../theme';

const DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
const two = (value: number) => String(value).padStart(2, '0');

export default function ClockPage() {
  const now = useNow();
  const {width} = useArea();
  const face = 39;
  return (
    <>
      <AnalogClock x={Math.floor((width - face) / 2)} y={1} diameter={face} />
      <Text x={width / 2} y={42} font="5x7" color={COLORS.text} align="center">
        {`${two(now.getHours())}:${two(now.getMinutes())}:${two(now.getSeconds())}`}
      </Text>
      <Text x={width / 2} y={51} font="4x6" color={COLORS.dim} align="center">
        {`${DAYS[now.getDay()]} ${now.getDate()} ${MONTHS[now.getMonth()]}`}
      </Text>
    </>
  );
}
