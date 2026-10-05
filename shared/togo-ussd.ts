export type TogoUssdValues = {
  amount: number | string;
  number: string;
  phone: string;
  currency: string;
  operator: string;
};

function payerPhoneDigits(value: string): string {
  const digits = value.replace(/\D/g, "");
  return digits.length === 11 && digits.startsWith("228")
    ? digits.slice(3)
    : digits;
}

const TOKENS: Record<keyof TogoUssdValues, (values: TogoUssdValues) => string> = {
  amount: (values) => String(values.amount),
  number: (values) => values.number.replace(/\D/g, ""),
  phone: (values) => payerPhoneDigits(values.phone),
  currency: (values) => values.currency,
  operator: (values) => values.operator,
};

const SUPPORTED_TOKENS = new Set([
  "amount",
  "number",
  "phone",
  "payerphone",
  "currency",
  "operator",
]);

export function isValidTogoUssdTemplate(template: string | null | undefined): boolean {
  if (!template?.trim()) return false;
  const matches = template.match(/\{[^{}]*\}/g) ?? [];
  if (matches.some((token) => !SUPPORTED_TOKENS.has(token.slice(1, -1).trim().toLowerCase()))) {
    return false;
  }
  return !/[{}]/.test(template.replace(/\{[^{}]*\}/g, ""));
}

export function renderTogoUssdTemplate(
  template: string | null | undefined,
  values: TogoUssdValues,
): string | null {
  if (!isValidTogoUssdTemplate(template)) return null;

  return template!.trim().replace(/\{([^{}]+)\}/g, (token, rawKey: string) => {
    const key = rawKey.trim().toLowerCase();
    if (key === "payerphone") return TOKENS.phone(values);
    return TOKENS[key as keyof TogoUssdValues](values);
  });
}
