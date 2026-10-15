// Registers the fetched fonts with react-twinkle. Import this module once,
// before anything is drawn.
import {registerMonoFont, setDefaultFont} from 'react-twinkle';
// Written by `npm run fonts`.
import data from '../../fonts/data';
import {FONTS} from './list';

Object.entries(FONTS).forEach(([name, baseline]) => {
  const [width, height] = name.split('x').map(Number);
  registerMonoFont(name, {width, height, baseline, data: Buffer.from(data[name], 'base64')});
});

setDefaultFont('5x7');
