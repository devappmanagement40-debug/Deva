const TMONEY_LOGO_URL = "/images/operators/tmoney.svg";
const MOOV_LOGO_URL = "/images/operators/moov.webp";

export function getTogoOperatorLogoUrl(operatorName: string): string | null {
  const normalizedName = operatorName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

  if (
    normalizedName.includes("tmoney") ||
    normalizedName.includes("togocom") ||
    normalizedName.includes("togocel") ||
    normalizedName.includes("yas")
  ) {
    return TMONEY_LOGO_URL;
  }

  if (normalizedName.includes("moov")) {
    return MOOV_LOGO_URL;
  }

  return null;
}

export function resolveTogoOperatorLogoUrl(
  operatorName: string,
  configuredLogoUrl?: string | null,
): string | null {
  return configuredLogoUrl?.trim() || getTogoOperatorLogoUrl(operatorName);
}
