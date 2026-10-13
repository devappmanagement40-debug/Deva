const SAFE_RASTER_MIME_EXTENSIONS: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

export function getSafeRasterImageExtension(
  mimeType: string,
  bytes: Uint8Array,
): string | null {
  const expectedExtension = SAFE_RASTER_MIME_EXTENSIONS[mimeType];
  if (!expectedExtension) return null;

  const isPng =
    expectedExtension === ".png" &&
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a;
  const isJpeg =
    expectedExtension === ".jpg" &&
    bytes.length >= 3 &&
    bytes[0] === 0xff &&
    bytes[1] === 0xd8 &&
    bytes[2] === 0xff;
  const isGif =
    expectedExtension === ".gif" &&
    bytes.length >= 6 &&
    String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3], bytes[4], bytes[5]).match(/^GIF8[79]a$/) !== null;
  const isWebp =
    expectedExtension === ".webp" &&
    bytes.length >= 12 &&
    String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3]) === "RIFF" &&
    String.fromCharCode(bytes[8], bytes[9], bytes[10], bytes[11]) === "WEBP";

  return isPng || isJpeg || isGif || isWebp ? expectedExtension : null;
}
