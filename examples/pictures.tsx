// Pictures: one drawn here (a file would be read with `decodeImage`),
// scaled up, turned, slid round by parts of a pixel, and contained in a
// box of another shape.
import {Box, Image, Rect, Text, rotate, scale, translate, useElapsedMs} from '../src';
import type {Picture} from '../src';

export const size = {width: 64, height: 64};
export const seconds = 6;

// A little flag, 10 by 8: four colours and a white stripe, its corners
// clear. Four bytes a pixel.
const FLAG: Picture = (() => {
  const [width, height] = [10, 8];
  const data = new Uint8Array(width * height * 4);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const corner = (x === 0 || x === width - 1) && (y === 0 || y === height - 1);
      const colours = [
        [230, 60, 60],
        [60, 200, 90],
        [70, 120, 255],
        [255, 190, 40],
      ];
      const stripe = y === 3 || y === 4;
      const quarter = (y < height / 2 ? 0 : 2) + (x < width / 2 ? 0 : 1);
      data.set(
        [...(stripe ? [255, 255, 255] : colours[quarter]), corner ? 0 : 255],
        (y * width + x) * 4,
      );
    }
  }
  return {data, width, height};
})();

// Made once: the flag at the sizes it is shown at.
const BIG = scale(FLAG, 28, 28, {fit: 'contain', filter: 'nearest'});
const SMOOTH = scale(FLAG, 28, 20, {fit: 'stretch'});
const WIDE = scale(FLAG, 30, 12, {fit: 'contain', filter: 'nearest'});

function Label({x, y, children}: {x: number; y: number; children: string}) {
  return (
    <Text x={x} y={y} font="4x6" color="#6e6e6e">
      {children}
    </Text>
  );
}

function Shown({picture, x = 0, y = 0}: {picture: Picture; x?: number; y?: number}) {
  return <Image x={x} y={y} width={picture.width} height={picture.height} data={picture.data} />;
}

export default function Pictures() {
  const elapsed = useElapsedMs();
  const turned = rotate(BIG, (elapsed / 6000) * 360, {filter: 'bilinear'});
  const slid = translate(SMOOTH, elapsed / 250, 0, {edge: 'wrap'});
  return (
    <>
      <Label x={1} y={0}>
        ROTATE
      </Label>
      <Box x={1} y={7} width={28} height={28}>
        <Rect width={28} height={28} fill="#101828" />
        <Shown picture={turned} />
      </Box>
      <Label x={34} y={0}>
        SLIDE
      </Label>
      <Box x={34} y={7} width={28} height={28}>
        <Rect width={28} height={28} fill="#101828" />
        <Shown picture={slid} y={4} />
      </Box>
      <Label x={1} y={40}>
        CONTAIN
      </Label>
      <Box x={1} y={47} width={30} height={12}>
        <Rect width={30} height={12} fill="#101828" />
        <Shown picture={WIDE} />
      </Box>
      <Label x={34} y={40}>
        NEAREST
      </Label>
      <Shown picture={scale(FLAG, 20, 16, {filter: 'nearest'})} x={38} y={47} />
    </>
  );
}
