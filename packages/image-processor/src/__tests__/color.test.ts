import { describe, it, expect } from 'vitest';
import { extractColors } from '../color';
import sharp from 'sharp';

describe('Color Extraction', () => {
  it('should extract colors from a multi-color image', async () => {
    // Create a two-tone image
    const svg = `<svg width="64" height="64">
      <rect width="32" height="64" fill="#ff3366"/>
      <rect x="32" width="32" height="64" fill="#3366ff"/>
    </svg>`;
    const buf = await sharp(Buffer.from(svg)).jpeg().toBuffer();
    const palette = await extractColors(buf);
    expect(palette.dominant.length).toBeGreaterThanOrEqual(1);
    expect(palette.average).toMatch(/^#[0-9a-f]{6}$/);
  });

  it('should return valid hex colors', async () => {
    const svg = `<svg width="32" height="32"><rect width="32" height="32" fill="#00ff00"/></svg>`;
    const buf = await sharp(Buffer.from(svg)).jpeg().toBuffer();
    const palette = await extractColors(buf);
    const hexRegex = /^#[0-9a-f]{6}$/;
    for (const c of palette.dominant) expect(c).toMatch(hexRegex);
    expect(palette.average).toMatch(hexRegex);
  });
});
