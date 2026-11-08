declare module "heic-decode" {
  /** The first image of a HEIC or HEIF file, as RGBA pixels */
  export default function decode(input: {
    buffer: Uint8Array;
  }): Promise<{ width: number; height: number; data: Uint8ClampedArray }>;
}
