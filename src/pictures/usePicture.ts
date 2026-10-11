import {useMemo} from 'react';
import {decodeImage} from './decode';
import gamma from './gamma';
import {scale} from './scale';
import type {Fit, ScaleFilter} from './scale';
import type {Picture} from './picture';

export interface UsePictureOptions {
  /** The size it is wanted at; as it is, unless both are given. */
  width?: number;
  height?: number;
  fit?: Fit;
  filter?: ScaleFilter;
  /** The gamma it is corrected by; none unless given. */
  gamma?: number;
}

/**
 * A picture made ready to draw, and remembered: the bytes of a file (JPEG,
 * PNG or GIF) decoded, or a picture as it is, then scaled and
 * gamma-corrected as asked. The work is done again only when the source or
 * an option changes, so the same bytes must be handed in from one frame to
 * the next. Undefined while there is no source, or if the bytes are not a
 * picture (`decodeImage` says why).
 */
export default function usePicture(
  source: Uint8Array | Picture | undefined,
  {
    width = undefined,
    height = undefined,
    fit = 'fill',
    filter = 'lanczos',
    gamma: correction = undefined,
  }: UsePictureOptions = {},
): Picture | undefined {
  return useMemo(() => {
    if (!source) {
      return undefined;
    }
    let picture: Picture;
    if (source instanceof Uint8Array) {
      try {
        picture = decodeImage(source);
      } catch (error) {
        return undefined;
      }
    } else {
      picture = source;
    }
    if (width !== undefined && height !== undefined) {
      picture = scale(picture, width, height, {fit, filter});
    }
    return correction === undefined ? picture : gamma(picture, correction);
  }, [source, width, height, fit, filter, correction]);
}
