// A picture is its bytes and its size. The bytes are three a pixel (RGB)
// or four (RGBA); which, is told from how many there are. Everything that
// makes a picture from another keeps the alpha it was given, and it is
// blended only when the picture is drawn.

/** A picture: its bytes, row by row, three or four a pixel, and its size. */
export interface Picture {
  data: Uint8Array;
  width: number;
  height: number;
}

/** How many bytes a pixel of the picture takes: 3 (RGB) or 4 (RGBA). */
export function channels({data, width, height}: Picture): 3 | 4 {
  const each = data.length / (width * height);
  if (each !== 3 && each !== 4) {
    throw new Error(
      `a picture ${width}x${height} takes ${width * height * 3} or ${width * height * 4} bytes`,
    );
  }
  return each;
}

/** A picture of `width` by `height` with nothing in it: RGBA, all clear. */
export function blank(width: number, height: number): Picture {
  return {data: new Uint8Array(width * height * 4), width, height};
}

/** The picture without its alpha: three bytes a pixel. */
export function toRgb(picture: Picture): Picture {
  if (channels(picture) === 3) {
    return picture;
  }
  const {data, width, height} = picture;
  const out = new Uint8Array(width * height * 3);
  for (let i = 0; i < width * height; i += 1) {
    out[i * 3] = data[i * 4];
    out[i * 3 + 1] = data[i * 4 + 1];
    out[i * 3 + 2] = data[i * 4 + 2];
  }
  return {data: out, width, height};
}

/** The picture with an alpha, opaque if it had none: four bytes a pixel. */
export function toRgba(picture: Picture): Picture {
  if (channels(picture) === 4) {
    return picture;
  }
  const {data, width, height} = picture;
  const out = new Uint8Array(width * height * 4);
  for (let i = 0; i < width * height; i += 1) {
    out[i * 4] = data[i * 3];
    out[i * 4 + 1] = data[i * 3 + 1];
    out[i * 4 + 2] = data[i * 3 + 2];
    out[i * 4 + 3] = 255;
  }
  return {data: out, width, height};
}

/** Whether every pixel is opaque: a picture that needs no alpha. */
export function isOpaque(picture: Picture): boolean {
  if (channels(picture) === 3) {
    return true;
  }
  const {data} = picture;
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] !== 255) {
      return false;
    }
  }
  return true;
}
