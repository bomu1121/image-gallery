import sharp from 'sharp';

const THUMBNAIL_SIZE = 256;

export async function generateThumbnail(
  input: Buffer | ArrayBuffer,
  size = THUMBNAIL_SIZE,
): Promise<Buffer> {
  const image = sharp(input);
  const metadata = await image.metadata();

  return image
    .resize(size, size, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 80 })
    .toBuffer();
}

export async function generateThumbnailBlob(
  input: Buffer | ArrayBuffer,
  size?: number,
): Promise<Blob> {
  const buffer = await generateThumbnail(input, size);
  return new Blob([buffer], { type: 'image/jpeg' });
}

export async function getImageMetadata(input: Buffer | ArrayBuffer) {
  const image = sharp(input);
  const meta = await image.metadata();
  return {
    width: meta.width ?? 0,
    height: meta.height ?? 0,
    format: meta.format ?? 'unknown',
    hasAlpha: meta.hasAlpha ?? false,
    orientation: meta.orientation,
  };
}
