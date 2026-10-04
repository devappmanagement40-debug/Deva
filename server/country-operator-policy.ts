export const DEFAULT_WITHDRAWAL_OPERATORS_BY_COUNTRY = {
  CI: ["Wave"],
  TG: ["TMoney", "Moov"],
} as const;

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

export function serializeCountryOperators(value: unknown): string {
  let parsed: unknown = value;
  if (typeof value === "string") {
    if (!value.trim()) return "[]";
    try {
      parsed = JSON.parse(value);
    } catch {
      throw new Error("La liste des opérateurs doit être un tableau JSON valide.");
    }
  }

  if (!Array.isArray(parsed)) {
    throw new Error("La liste des opérateurs doit être un tableau.");
  }
  if (parsed.some((item) => typeof item !== "string")) {
    throw new Error("Chaque opérateur doit être un texte.");
  }

  return JSON.stringify(parseCountryOperators(JSON.stringify(parsed)));
}

export function resolveCountryOperator(value: unknown, requestedOperator: string): string | undefined {
  const requested = requestedOperator.trim().toLowerCase();
  if (!requested) return undefined;
  return parseCountryOperators(value).find((operator) => operator.toLowerCase() === requested);
}