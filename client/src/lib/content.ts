// Helper to read admin-editable text content from the /api/settings key-value map,
// falling back to the field's default when the setting is absent or empty.

export function rebrandText(value: string): string {
  return value.replace(/\bTGOO[DG]\b/gi, "DIAMANT");
}

export function getContent(
  settings: Record<string, string> | undefined,
  key: string,
  fallback: string
): string {
  const value = settings?.[key];
  return rebrandText(value !== undefined && value.trim() !== "" ? value : fallback);
}
