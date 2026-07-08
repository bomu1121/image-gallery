import sharp from 'sharp';

export interface ColorPalette {
  dominant: string[];
  accent: string[];
  average: string;
}

/**
 * Extract dominant colors from an image.
 * Resizes to 1x1 for average color, and uses a simple
 * quantization approach for dominant/accent colors.
 */
export async function extractColors(input: Buffer): Promise<ColorPalette> {
  // Average color via 1x1 resize
  const { data: avgData } = await sharp(input)
    .resize(1, 1)
    .raw()
    .toBuffer({ resolveWithObject: true });

  const [r, g, b] = avgData;
  const average = rgbToHex(r, g, b);

  // Simple dominant color sampling: resize small, then cluster
  const { data, info } = await sharp(input)
    .resize(50, 50, { fit: 'inside' })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const pixels = new Uint8Array(data);
  const colorMap = new Map<string, number>();

  for (let i = 0; i < pixels.length; i += 3) {
    const hex = rgbToHex(pixels[i], pixels[i + 1], pixels[i + 2]);
    colorMap.set(hex, (colorMap.get(hex) ?? 0) + 1);
  }

  const sorted = [...colorMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const dominant = sorted.slice(0, 2).map(([hex]) => hex);
  const accent = sorted.slice(2, 5).map(([hex]) => hex);

  return { dominant, accent, average };
}

function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b].map((c) => c.toString(16).padStart(2, '0')).join('')}`;
}
