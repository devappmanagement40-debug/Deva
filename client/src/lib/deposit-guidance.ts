import { hasObsoletePaymentCopy } from "./content";

export function formatDepositGuidanceContent(
  value: string,
  formattedMinimum: string,
): string {
  return value
    .replace(/\{\{?\s*minDeposit\s*\}?\}/gi, formattedMinimum)
    .replace(
      /((?:minimum\s+(?:de\s+)?(?:dépôt|recharge|deposit)|(?:dépôt|recharge|deposit)\s+minimum)[^.\n]*?)\d[\d\s.,\u00a0\u202f]*\s*(?:XOF|FCFA)/gi,
      (_match, prefix: string) => `${prefix}${formattedMinimum} USDT`,
    )
    .split(/(?<=[.!?])\s+|\n+/)
    .filter((part) => !hasObsoletePaymentCopy(part))
    .join(" ");
}