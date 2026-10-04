export function parseCountryOperators(value: unknown): string[] {
  if (typeof value !== "string") return [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    return [];
  }

  if (!Array.isArray(parsed)) return [];

  const unique = new Map<string, string>();
  for (const item of parsed) {
    if (typeof item !== "string") continue;
    const operator = item.trim();
    const key = operator.toLowerCase();
    if (operator && !unique.has(key)) unique.set(key, operator);
  }
  return Array.from(unique.values());
}

export function resolveCountryOperator(value: unknown, requestedOperator: string): string | undefined {
  const requested = requestedOperator.trim().toLowerCase();
  if (!requested) return undefined;
  return parseCountryOperators(value).find((operator) => operator.toLowerCase() === requested);
}