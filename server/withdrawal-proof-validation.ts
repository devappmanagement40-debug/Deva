import { z } from "zod";

const proofImagePattern = /^data:image\/(?:png|jpe?g|webp);base64,[A-Za-z0-9+/]+={0,2}$/;
const proofImageSchema = z.string()
  .regex(proofImagePattern, "Une capture au format PNG, JPG ou WebP est requise")
  .max(7_100_000, "L'image de preuve ne peut pas dépasser 5 Mo");

export const withdrawalProofSubmissionSchema = z.object({
  message: z.string().trim().min(1, "Ajoutez un message").max(500, "Le message ne peut pas dépasser 500 caractères"),
  proof: proofImageSchema,
  proof2: proofImageSchema.optional(),
}).strict();

export const withdrawalProofReviewSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("approve"),
    shareBonusXof: z.number().int().min(0).max(2_147_483_647),
  }),
  z.object({
    action: z.literal("reject"),
  }),
]);

export function maskPhoneForWithdrawalProof(phone: string): string {
  const hasInternationalPrefix = phone.trim().startsWith("+");
  const digits = phone.replace(/\D/g, "");
  if (!digits) return "••••••";

  if (digits.length <= 6) {
    const startLength = Math.min(2, digits.length);
    const endLength = Math.min(2, Math.max(0, digits.length - startLength));
    const hiddenLength = Math.max(2, digits.length - startLength - endLength);
    const end = endLength > 0 ? digits.slice(-endLength) : "";
    return `${hasInternationalPrefix ? "+" : ""}${digits.slice(0, startLength)}${"•".repeat(hiddenLength)}${end}`;
  }

  const startLength = Math.min(6, digits.length - 5);
  const endLength = 3;
  const hiddenLength = digits.length - startLength - endLength;
  return `${hasInternationalPrefix ? "+" : ""}${digits.slice(0, startLength)}${"•".repeat(hiddenLength)}${digits.slice(-endLength)}`;
}