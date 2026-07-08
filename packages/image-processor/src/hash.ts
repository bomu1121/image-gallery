import sharp from 'sharp';

/**
 * Generate a perceptual hash (pHash) for image comparison.
 * Uses a simple DCT-based approach: resize to 32x32, grayscale,
 * compute average, and compare each pixel to the average.
 */
export async function generatePHash(input: Buffer): Promise<string> {
  const { data, info } = await sharp(input)
    .resize(32, 32, { fit: 'fill' })
    .grayscale()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const pixels = new Uint8Array(data);
  const avg = pixels.reduce((sum, p) => sum + p, 0) / pixels.length;

  let hash = '';
  for (let i = 0; i < pixels.length; i++) {
    hash += pixels[i] >= avg ? '1' : '0';
  }

  // Convert binary string to hex for compact storage
  const hexParts: string[] = [];
  for (let i = 0; i < hash.length; i += 4) {
    hexParts.push(Number.parseInt(hash.slice(i, i + 4), 2).toString(16));
  }

  return hexParts.join('');
}

/**
 * Calculate Hamming distance between two hex-encoded pHash strings.
 * Returns 0 (identical) to 1 (completely different).
 */
export function hammingDistance(hash1: string, hash2: string): number {
  if (hash1.length !== hash2.length) return 1;
  let diff = 0;
  for (let i = 0; i < hash1.length; i++) {
    const b1 = Number.parseInt(hash1[i], 16);
    const b2 = Number.parseInt(hash2[i], 16);
    let xor = b1 ^ b2;
    while (xor) { diff++; xor &= xor - 1; }
  }
  return diff / (hash1.length * 4);
}
