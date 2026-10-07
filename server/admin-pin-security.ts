import { timingSafeEqual } from "node:crypto";
import bcrypt from "bcryptjs";

export const ADMIN_ACCESS_PIN_MIN_LENGTH = 4;
export const ADMIN_ACCESS_PIN_MAX_LENGTH = 4;

const BCRYPT_HASH_PATTERN = /^\$2[ab]\$\d{2}\$/;

export function isValidAdminAccessPin(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length === ADMIN_ACCESS_PIN_MIN_LENGTH &&
    /^\d+$/.test(value)
  );
}

export async function hashAdminAccessPin(pin: string): Promise<string> {
  return bcrypt.hash(pin, 12);
}

export async function verifyAdminAccessPin(
  suppliedPin: string,
  storedPin: string,
): Promise<{ valid: boolean; upgradedHash?: string }> {
  if (BCRYPT_HASH_PATTERN.test(storedPin)) {
    return { valid: await bcrypt.compare(suppliedPin, storedPin) };
  }

  const suppliedBytes = Buffer.from(suppliedPin, "utf8");
  const storedBytes = Buffer.from(storedPin, "utf8");
  const valid =
    suppliedBytes.length === storedBytes.length &&
    timingSafeEqual(suppliedBytes, storedBytes);

  return valid
    ? { valid: true, upgradedHash: await hashAdminAccessPin(suppliedPin) }
    : { valid: false };
}
