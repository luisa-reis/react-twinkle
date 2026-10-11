import {describe, expect, it} from 'vitest';
import {Image, createRoot, encodePng, usePicture} from '../src';
import type {Picture} from '../src';
import {picture} from './support/pictures';

describe('usePicture', () => {
  interface ShownProps {
    source: Uint8Array | Picture | undefined;
    width?: number;
  }

  function Shown({source, width = undefined}: ShownProps) {
    const made = usePicture(source, {width, height: 2, filter: 'nearest'});
    return made ? <Image width={made.width} height={made.height} data={made.data} /> : null;
  }

  it('decodes, scales and draws, blending the alpha', () => {
    const root = createRoot({width: 4, height: 2, background: '#0000ff'});
    root.render(<Shown source={encodePng(picture('r.', '.r'))} width={4} />);
    const canvas = root.frame();
    expect(canvas.get(0, 0)).toEqual({r: 255, g: 0, b: 0});
    expect(canvas.get(2, 0)).toEqual({r: 0, g: 0, b: 255});
    expect(canvas.get(3, 1)).toEqual({r: 255, g: 0, b: 0});
  });

  it('takes a picture as it is, and nothing for no picture', () => {
    const root = createRoot({width: 2, height: 2});
    root.render(<Shown source={picture('gg', 'gg')} />);
    expect(root.frame().get(1, 1)).toEqual({r: 0, g: 255, b: 0});
    root.render(<Shown source={Buffer.from('not a picture')} />);
    expect(root.frame().get(1, 1)).toEqual({r: 0, g: 0, b: 0});
    root.render(<Shown source={undefined} />);
    expect(root.frame().get(1, 1)).toEqual({r: 0, g: 0, b: 0});
  });
});
