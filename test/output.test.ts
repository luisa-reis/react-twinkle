import {describe, expect, it} from 'vitest';
import dgram from 'node:dgram';
import zlib from 'node:zlib';
import DdpOutput, {chunks, packets, parseTarget} from '../src/output/ddp';
import {animationParts, encodeApng, encodePng, scaleUp} from '../src/output/png';
import type {Picture} from '../src/output/png';

describe('DDP', () => {
  it('splits a frame evenly, between pixels', () => {
    const frame = 64 * 64 * 3;
    const parts = chunks(frame);
    expect(parts).toHaveLength(9);
    expect(parts[0]).toEqual([0, 1368]);
    expect(parts[8]).toEqual([8 * 1368, 1344]);
    expect(parts.reduce((sum, [, length]) => sum + length, 0)).toBe(frame);
    expect(chunks(0)).toEqual([]);
    expect(chunks(128 * 64 * 3)).toHaveLength(18);
  });

  it('pushes on the last packet only', () => {
    const out = packets(new Uint8Array(1443).fill(7), 3);
    expect(out.map((p) => p[0])).toEqual([0x40, 0x41]);
    expect([...out[1].subarray(1, 10)]).toEqual([3, 0x0b, 1, 0, 0, 2, 0xd3, 2, 0xd0]);
    expect(out[1][10]).toBe(7);
  });

  it('sends every packet before it closes', async () => {
    const listener = dgram.createSocket('udp4');
    const got: number[] = [];
    listener.on('message', (message) => got.push(message[0]));
    await new Promise<void>((resolve) => {
      listener.bind(0, '127.0.0.1', resolve);
    });
    const output = new DdpOutput(`127.0.0.1:${listener.address().port}`);
    output.send(new Uint8Array(64 * 64 * 3));
    output.send(new Uint8Array(64 * 64 * 3));
    await output.close();
    await new Promise((resolve) => {
      setTimeout(resolve, 50);
    });
    listener.close();
    expect(got).toHaveLength(18);
    expect(got.filter((first) => first === 0x41)).toHaveLength(2);
  });

  it('defaults the port', () => {
    expect(parseTarget('wled.local')).toEqual({host: 'wled.local', port: 4048});
    expect(parseTarget('4.3.2.1:21324')).toEqual({host: '4.3.2.1', port: 21324});
  });
});

describe('PNG', () => {
  const picture = (lit: number[] | null): Picture => {
    const data = new Uint8Array(4 * 4 * 3);
    if (lit) {
      data.fill(255, (lit[1] * 4 + lit[0]) * 3, (lit[1] * 4 + lit[0]) * 3 + 3);
    }
    return {data, width: 4, height: 4};
  };

  it('writes pixels that read back', () => {
    const png = encodePng(scaleUp(picture([1, 2]), 2));
    expect(png.readUInt32BE(16)).toBe(8);
    const length = png.readUInt32BE(33);
    const raw = zlib.inflateSync(png.subarray(41, 41 + length));
    expect(raw).toHaveLength(8 * (8 * 3 + 1));
    expect(raw[4 * 25 + 1 + 2 * 3]).toBe(255);
    expect(raw[4 * 25 + 1 + 4 * 3]).toBe(0);
  });

  it('stores what changed and for how long', () => {
    const frames = [null, null, [1, 2], [1, 2], [1, 2], [3, 2]].map(picture);
    const parts = animationParts(frames.map((frame) => scaleUp(frame, 2)));
    expect(parts.map((p) => [p.x, p.y, p.width, p.height, p.frames])).toEqual([
      [0, 0, 8, 8, 2],
      [2, 4, 2, 2, 3],
      [2, 4, 6, 2, 1],
    ]);
    const apng = encodeApng(frames, 10);
    expect(apng.includes(Buffer.from('acTL'))).toBe(true);
    expect(apng.includes(Buffer.from('fdAT'))).toBe(true);
  });
});
