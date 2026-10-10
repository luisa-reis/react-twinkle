// DDP (Distributed Display Protocol) over UDP: what WLED listens for on
// port 4048 and shows as realtime input, falling back to its presets a
// couple of seconds after the stream stops.
import dgram from 'node:dgram';

/** The header is ten bytes, its multi-byte fields big-endian. */
const HEADER = 10;
/** Byte 0: protocol version 1, and "push" (show the frame now). */
const VER1 = 0x40;
const PUSH = 0x01;
/** Byte 2, the data type: RGB, eight bits a channel. */
const TYPE_RGB8 = 0x0b;
/** Byte 3, the destination: 1 is the default output. */
const DEST_DEFAULT = 0x01;
/** The most data a packet may carry (480 pixels), which fits a 1500-byte MTU. */
const MAX_DATA = 1440;
const PIXEL = 3;
export const DEFAULT_PORT = 4048;

/**
 * Where each packet's data starts in a frame of `length` bytes, and how
 * long it is: as few packets as the limit allows, sharing the frame evenly
 * and splitting between pixels.
 */
export function chunks(length: number): [number, number][] {
  if (length === 0) {
    return [];
  }
  const count = Math.ceil(length / MAX_DATA);
  const each = Math.ceil(Math.ceil(length / count) / PIXEL) * PIXEL;
  const out: [number, number][] = [];
  for (let offset = 0; offset < length; offset += each) {
    out.push([offset, Math.min(each, length - offset)]);
  }
  return out;
}

/** The packets one RGB frame goes out as; only the last says "push". */
export function packets(rgb: Uint8Array, sequence: number): Buffer[] {
  return chunks(rgb.length).map(([offset, length]) => {
    const packet = Buffer.alloc(HEADER + length);
    packet[0] = VER1 | (offset + length >= rgb.length ? PUSH : 0);
    packet[1] = sequence;
    packet[2] = TYPE_RGB8;
    packet[3] = DEST_DEFAULT;
    packet.writeUInt32BE(offset, 4);
    packet.writeUInt16BE(length, 8);
    packet.set(rgb.subarray(offset, offset + length), HEADER);
    return packet;
  });
}

/** Where frames are sent: a host and a UDP port. */
export interface DdpTarget {
  host: string;
  port: number;
}

/** "host" or "host:port" as { host, port }, the port DDP's unless given. */
export function parseTarget(target: string): DdpTarget {
  const at = target.lastIndexOf(':');
  if (at < 0) {
    return {host: target, port: DEFAULT_PORT};
  }
  return {host: target.slice(0, at), port: Number(target.slice(at + 1))};
}

/**
 * Sends frames to a WLED matrix. The socket is not connected, on purpose:
 * datagrams sent while the board reboots are simply lost.
 */
export default class DdpOutput {
  host: string;

  port: number;

  sequence: number;

  pending: number;

  whenIdle: (() => void) | undefined;

  socket: dgram.Socket;

  constructor(target: string) {
    const {host, port} = parseTarget(target);
    this.host = host;
    this.port = port;
    this.sequence = 1;
    this.pending = 0;
    this.whenIdle = undefined;
    this.socket = dgram.createSocket('udp4');
    // A send that fails (the board is away) is not worth stopping for.
    this.socket.on('error', () => {});
  }

  /** Sends one frame, the canvas's RGB bytes. */
  send(rgb: Uint8Array): void {
    packets(rgb, this.sequence).forEach((packet) => {
      this.pending += 1;
      this.socket.send(packet, this.port, this.host, () => {
        this.pending -= 1;
        if (this.pending === 0 && this.whenIdle) {
          this.whenIdle();
        }
      });
    });
    // Sequence numbers run 1 to 15; 0 means "not used".
    this.sequence = this.sequence >= 15 ? 1 : this.sequence + 1;
  }

  /** Closes the socket, once what was sent has gone out. */
  close(): Promise<void> {
    return new Promise<void>((resolve) => {
      const shut = () => this.socket.close(resolve);
      if (this.pending === 0) {
        shut();
      } else {
        this.whenIdle = shut;
      }
    });
  }
}
