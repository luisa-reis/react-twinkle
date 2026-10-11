import {describe, expect, it} from 'vitest';
import jpeg from 'jpeg-js';
import {GifWriter} from 'omggif';
import {
  blank,
  channels,
  decodeFrames,
  decodeImage,
  encodePng,
  isOpaque,
  pictureFormat,
  toRgb,
  toRgba,
} from '../src';
import {letters, picture} from './support/pictures';

describe('a picture', () => {
  it('is RGB or RGBA by its bytes', () => {
    expect(channels(picture('rg'))).toBe(3);
    expect(channels(picture('r.'))).toBe(4);
    expect(() => channels({data: new Uint8Array(5), width: 1, height: 1})).toThrow('3 or 4 bytes');
    expect(channels(blank(2, 3))).toBe(4);
  });

  it('gains and loses its alpha', () => {
    const opaque = toRgba(picture('rg'));
    expect([...opaque.data]).toEqual([255, 0, 0, 255, 0, 255, 0, 255]);
    expect(isOpaque(opaque)).toBe(true);
    expect(isOpaque(picture('r.'))).toBe(false);
    expect(letters(toRgb(picture('r.')))).toEqual(['rk']);
  });
});

describe('decoding', () => {
  it('tells the format from the first bytes', () => {
    expect(pictureFormat(encodePng(picture('r')))).toBe('png');
    expect(pictureFormat(Uint8Array.from([0xff, 0xd8, 0xff]))).toBe('jpeg');
    expect(pictureFormat(Buffer.from('GIF89a'))).toBe('gif');
    expect(pictureFormat(Buffer.from('hello'))).toBeUndefined();
    expect(() => decodeImage(Buffer.from('hello'))).toThrow('not a JPEG, a PNG or a GIF');
    expect(() => decodeImage(Uint8Array.from([0x89, 0x50, 1, 2]))).toThrow('decoding picture');
  });

  it('reads a PNG as RGB when all of it is opaque', () => {
    const drawn = picture('rg', 'bw');
    const read = decodeImage(encodePng(drawn));
    expect(read).toEqual(drawn);
  });

  it('keeps the alpha of a PNG that has one', () => {
    const drawn = picture('r.', '.w');
    const read = decodeImage(encodePng(drawn));
    expect(channels(read)).toBe(4);
    expect(letters(read)).toEqual(['r.', '.w']);
  });

  it('reads a JPEG', () => {
    const flat = {data: new Uint8Array(8 * 8 * 4).fill(200), width: 8, height: 8};
    const read = decodeImage(jpeg.encode(flat, 100).data);
    expect([read.width, read.height, channels(read)]).toEqual([8, 8, 3]);
    expect(Math.abs(read.data[0] - 200)).toBeLessThan(3);
  });

  it('reads a GIF, and every frame of an animated one', () => {
    const bytes = new Uint8Array(1024);
    const palette = [0x000000, 0xff0000, 0x00ff00, 0x0000ff];
    const writer = new GifWriter(bytes, 2, 2, {palette, loop: 0});
    writer.addFrame(0, 0, 2, 2, [1, 2, 3, 0], {delay: 5});
    // The second frame changes one pixel and leaves the rest showing.
    writer.addFrame(1, 1, 1, 1, [2], {delay: 20, transparent: 0});
    const gif = bytes.subarray(0, writer.end());
    expect(letters(decodeImage(gif))).toEqual(['rg', 'bk']);
    const frames = decodeFrames(gif);
    expect(frames.map((frame) => frame.delayMs)).toEqual([50, 200]);
    expect(letters(frames[1].picture)).toEqual(['rg', 'bg']);
    expect(decodeFrames(encodePng(picture('r')))).toHaveLength(1);
  });
});
