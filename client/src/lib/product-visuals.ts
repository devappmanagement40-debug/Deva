export function getProductImageUrl(imageUrl: string | null | undefined): string | null {
  const url = imageUrl?.trim();
  return url || null;
}
