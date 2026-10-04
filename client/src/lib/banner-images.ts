const BANNER_CONFIG_VERSION = 1;

function cleanImages(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((image): image is string => typeof image === "string" && image.trim().length > 0)
    .map((image) => image.trim());
}

export function parseBannerImages(value: string | undefined, fallback: readonly string[]): string[] {
  if (typeof value !== "string" || !value.trim()) return [...fallback];

  try {
    const parsed: unknown = JSON.parse(value);
    if (Array.isArray(parsed)) {
      const images = cleanImages(parsed);
      return images.length > 0 ? images : [...fallback];
    }

    if (
      parsed &&
      typeof parsed === "object" &&
      "version" in parsed &&
      parsed.version === BANNER_CONFIG_VERSION &&
      "configured" in parsed &&
      parsed.configured === true &&
      "images" in parsed
    ) {
      return cleanImages(parsed.images);
    }
  } catch {
    // Invalid or legacy values use the built-in banner images.
  }

  return [...fallback];
}

export function serializeBannerImages(images: readonly string[]): string {
  return JSON.stringify({
    version: BANNER_CONFIG_VERSION,
    configured: true,
    images: cleanImages(images),
  });
}