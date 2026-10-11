import {describe, expect, it} from 'vitest';
import {channels, flip, rotate, translate} from '../src';
import {letters, picture} from './support/pictures';

describe('turning and moving', () => {
  const corners = picture('rg', 'bw');

  it('turns clockwise, a quarter at a time, pixel for pixel', () => {
    expect(letters(rotate(corners, 90))).toEqual(['br', 'wg']);
    expect(letters(rotate(corners, 180))).toEqual(['wb', 'gr']);
    expect(letters(rotate(corners, -90))).toEqual(['gw', 'rb']);
    expect(letters(rotate(corners, 360))).toEqual(['rg', 'bw']);
    expect(channels(rotate(corners, 90))).toBe(4);
    expect(channels(rotate(corners, 90, {edge: 'clamp'}))).toBe(3);
  });

  it('leaves what a turn uncovers clear, or fills it from the edge', () => {
    const block = picture('wwww', 'wwww', 'wwww', 'wwww');
    expect(letters(rotate(block, 45))).toEqual(['.ww.', 'wwww', 'wwww', '.ww.']);
    expect(letters(rotate(block, 45, {edge: 'clamp'}))).toEqual(['wwww', 'wwww', 'wwww', 'wwww']);
  });

  it('turns about another point', () => {
    const dot = picture('r..', '...', '...');
    expect(letters(rotate(dot, 90, {origin: [0, 0]}))).toEqual(['r..', '...', '...']);
    expect(letters(rotate(dot, 90))).toEqual(['..r', '...', '...']);
  });

  it('blends the four pixels around with the bilinear filter', () => {
    const turned = rotate(picture('kkk', 'kwk', 'kkk'), 45, {filter: 'bilinear', edge: 'clamp'});
    expect(turned.data[4 * 3]).toBe(255);
    expect(turned.data[1 * 3]).toBeGreaterThan(0);
    expect(turned.data[1 * 3]).toBeLessThan(255);
  });

  it('moves by whole pixels exactly', () => {
    expect(letters(translate(picture('rgb'), 1, 0))).toEqual(['.rg']);
    expect(letters(translate(picture('rgb'), -1, 0, {edge: 'wrap'}))).toEqual(['gbr']);
    expect(letters(translate(picture('r', 'g'), 0, 1, {edge: 'clamp'}))).toEqual(['r', 'r']);
  });

  it('moves by part of a pixel', () => {
    const moved = translate(picture('wk'), 0.25, 0, {edge: 'wrap'});
    expect([...moved.data]).toEqual([191, 191, 191, 64, 64, 64]);
    const cleared = translate(picture('w'), 0.5, 0);
    expect([...cleared.data]).toEqual([255, 255, 255, 128]);
    expect(letters(translate(picture('wk'), 0.4, 0, {filter: 'nearest'}))).toEqual(['wk']);
  });

  it('flips', () => {
    expect(letters(flip(corners, 'horizontal'))).toEqual(['gr', 'wb']);
    expect(letters(flip(corners, 'vertical'))).toEqual(['bw', 'rg']);
  });
});
