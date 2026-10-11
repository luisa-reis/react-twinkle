import {describe, expect, it} from 'vitest';
import {channels, crop, resize, scale} from '../src';
import {letters, picture} from './support/pictures';

describe('scaling', () => {
  it('keeps pixel art whole with the nearest filter', () => {
    expect(letters(resize(picture('rg', 'bw'), 4, 4, 'nearest'))).toEqual([
      'rrgg',
      'rrgg',
      'bbww',
      'bbww',
    ]);
    expect(letters(resize(picture('rrgg', 'rrgg', 'bbww', 'bbww'), 2, 2, 'nearest'))).toEqual([
      'rg',
      'bw',
    ]);
  });

  it('gives the same picture back at the same size', () => {
    const drawn = picture('rg');
    expect(resize(drawn, 2, 1)).toBe(drawn);
  });

  it('averages with Lanczos, and stays within a byte', () => {
    const flat = {data: new Uint8Array(6 * 6 * 3).fill(90), width: 6, height: 6};
    expect([...resize(flat, 3, 2).data]).toEqual(new Array(18).fill(90));
    const edge = resize(picture('kkkwww'), 3, 1);
    expect(edge.data[0]).toBe(0);
    expect(edge.data[6]).toBe(255);
  });

  it('does not let a clear pixel lend its colour', () => {
    const half = {data: Uint8Array.from([255, 0, 0, 255, 0, 255, 0, 0]), width: 2, height: 1};
    const [r, g, , a] = resize(half, 1, 1).data;
    expect([r, g]).toEqual([255, 0]);
    expect(a).toBeGreaterThan(100);
    expect(a).toBeLessThan(155);
  });

  it('fills a size, cropping evenly', () => {
    const wide = picture('rggb', 'rggb');
    expect(letters(scale(wide, 2, 2, {filter: 'nearest'}))).toEqual(['gg', 'gg']);
    const tall = picture('r', 'g', 'g', 'b');
    expect(letters(scale(tall, 1, 2, {filter: 'nearest'}))).toEqual(['g', 'g']);
  });

  it('contains a picture, leaving the rest clear', () => {
    const wide = picture('rggb', 'rggb');
    expect(letters(scale(wide, 4, 4, {fit: 'contain', filter: 'nearest'}))).toEqual([
      '....',
      'rggb',
      'rggb',
      '....',
    ]);
    expect(channels(scale(wide, 2, 1, {fit: 'contain', filter: 'nearest'}))).toBe(3);
  });

  it('stretches to any shape', () => {
    expect(letters(scale(picture('rg'), 2, 2, {fit: 'stretch', filter: 'nearest'}))).toEqual([
      'rg',
      'rg',
    ]);
  });

  it('crops within the picture', () => {
    expect(letters(crop(picture('rgb', 'wkr'), 1, 0, 5, 5))).toEqual(['gb', 'kr']);
  });
});
