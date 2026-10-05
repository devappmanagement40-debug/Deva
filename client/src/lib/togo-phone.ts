export function getTogoPhoneDigits(value: string): string {
  const digits = value.replace(/\D/g, "");
  const nationalDigits =
    digits.length === 11 && digits.startsWith("228")
      ? digits.slice(3)
      : digits;

  return nationalDigits.slice(0, 8);
}
