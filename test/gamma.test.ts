import {describe, expect, it} from 'vitest';
import {gamma} from '../src';

describe('gamma', () => {
  it('darkens the middle and leaves the ends and the alpha', () => {
    const grey = {data: Uint8Array.from([0, 128, 255, 128]), width: 1, height: 1};
    expect([...gamma(grey, 2.2).data]).toEqual([0, 56, 255, 128]);
    expect([...gamma(grey, 1).data]).toEqual([0, 128, 255, 128]);
  });
});
