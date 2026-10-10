// The canvas everything is drawn into: the panel's pixels as row-major RGB
// bytes, which is also what a DDP stream carries. A pixel drawn with alpha
// is blended over what is there.

import type {Color, Rgb} from './color';

export default class Canvas {
  width: number;

  height: number;

  px: Uint8Array;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.px = new Uint8Array(width * height * 3);
  }

  /** Paints every pixel one colour, alpha ignored. */
  clear(color: Rgb = {r: 0, g: 0, b: 0}): void {
    for (let i = 0; i < this.px.length; i += 3) {
      this.px[i] = color.r;
      this.px[i + 1] = color.g;
      this.px[i + 2] = color.b;
    }
  }

  /** The colour at a pixel, as { r, g, b }. */
  get(x: number, y: number): Rgb {
    const i = (y * this.width + x) * 3;
    return {r: this.px[i], g: this.px[i + 1], b: this.px[i + 2]};
  }

  /** Blends one pixel over what is there; off the canvas it is dropped. */
  set(x: number, y: number, color: Color): void {
    if (x < 0 || y < 0 || x >= this.width || y >= this.height || color.a === 0) {
      return;
    }
    const i = (y * this.width + x) * 3;
    if (color.a === 255) {
      this.px[i] = color.r;
      this.px[i + 1] = color.g;
      this.px[i + 2] = color.b;
      return;
    }
    const {a} = color;
    const blend = (src: number, dst: number) => Math.floor((src * a + dst * (255 - a) + 127) / 255);
    this.px[i] = blend(color.r, this.px[i]);
    this.px[i + 1] = blend(color.g, this.px[i + 1]);
    this.px[i + 2] = blend(color.b, this.px[i + 2]);
  }

  /** A copy that shares nothing with this canvas. */
  clone(): Canvas {
    const copy = new Canvas(this.width, this.height);
    copy.px.set(this.px);
    return copy;
  }
}
