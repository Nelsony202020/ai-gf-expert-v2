import sharp from 'sharp';

/** Do not invent pixels — a 1024px ChatGPT card stays 1024px. */
export async function prepareRoundupBanner(
  input: Buffer,
): Promise<{ buffer: Buffer; width: number; height: number; upscaled: boolean }> {
  const meta = await sharp(input).metadata();
  return {
    buffer: input,
    width: meta.width ?? 0,
    height: meta.height ?? 0,
    upscaled: false,
  };
}
