// Reads numbers a few bits at a time, lowest bits first.
export default class BitReader {
  bytes: Uint8Array;

  at: number;

  bitPosition: number;

  current: number;

  constructor(bytes: Uint8Array, at: number) {
    this.bytes = bytes;
    this.at = at;
    this.bitPosition = 8;
    this.current = 0;
  }

  unsigned(bits: number): number {
    const start = this.bitPosition;
    let end = start + bits;
    // The shifts wrap at eight, as the u8g2-fonts crate's do.
    let value = this.current >> (start & 7);
    if (end >= 8) {
      const next = this.bytes[this.at];
      this.at += 1;
      end -= 8;
      this.current = next;
      value |= (next << ((8 - start) & 7)) & 0xff;
    }
    this.bitPosition = end;
    return value & ((1 << bits) - 1) & 0xff;
  }

  signed(bits: number): number {
    return (((this.unsigned(bits) - (1 << (bits - 1))) & 0xff) << 24) >> 24;
  }
}
