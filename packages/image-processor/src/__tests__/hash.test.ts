import { describe, it, expect } from 'vitest';
import { generatePHash, hammingDistance } from '../hash';
import sharp from 'sharp';

describe('Perceptual Hash', () => {
  it('should generate a hash for an image', async () => {
    const buf = await sharp({ create: { width: 64, height: 64, channels: 3, background: '#ff0000' } })
      .jpeg()
      .toBuffer();
    const hash = await generatePHash(buf);
    expect(hash).toBeDefined();
    expect(hash.length).toBeGreaterThan(0);
  });

  it('should return distance 0 for identical images', async () => {
    const buf = await sharp({ create: { width: 32, height: 32, channels: 3, background: '#336699' } })
      .jpeg()
      .toBuffer();
    const h1 = await generatePHash(buf);
    const h2 = await generatePHash(buf);
    expect(hammingDistance(h1, h2)).toBe(0);
  });

  it('should return non-zero distance for structurally different images', async () => {
    const buf1 = await sharp({ create: { width: 32, height: 32, channels: 3, background: '#cc0000' } })
      .jpeg()
      .toBuffer();
    // Create a visibly different image: gradient
    const gradientSvg = `<svg width="32" height="32"><defs><linearGradient id="g"><stop offset="0%" stop-color="black"/><stop offset="100%" stop-color="white"/></linearGradient></defs><rect width="32" height="32" fill="url(#g)"/></svg>`;
    const buf2 = await sharp(Buffer.from(gradientSvg)).jpeg().toBuffer();
    const h1 = await generatePHash(buf1);
    const h2 = await generatePHash(buf2);
    expect(hammingDistance(h1, h2)).toBeGreaterThan(0);
  });
});
