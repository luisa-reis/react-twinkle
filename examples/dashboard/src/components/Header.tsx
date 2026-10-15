// A page's title along the top, with a note at the right if there is one.
import {Text, useArea} from 'react-twinkle';
import COLORS from '../theme';

interface HeaderProps {
  title: string;
  note?: string;
}

export default function Header({title, note = undefined}: HeaderProps) {
  const {width} = useArea();
  return (
    <>
      <Text x={1} y={1} font="4x6" color={COLORS.accent}>
        {title.toUpperCase()}
      </Text>
      {note && (
        <Text x={width - 1} y={1} font="4x6" color={COLORS.dim} align="right">
          {note.toUpperCase()}
        </Text>
      )}
    </>
  );
}
