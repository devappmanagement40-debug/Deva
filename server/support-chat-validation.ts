import { z } from "zod";

export const supportChatMessageSchema = z.object({
  message: z.string().trim().max(2000, "Le message est trop long").default(""),
  attachmentUrl: z.string()
    .trim()
    .max(300)
    .regex(
      /^\/api\/support-chat\/files\/support-[a-f0-9]{32}\.(?:jpg|png|webp|gif|mp4|webm|pdf)$/i,
      "Pièce jointe invalide",
    )
    .optional(),
  attachmentType: z.enum(["image", "video", "file"]).optional(),
  attachmentName: z.string().trim().max(180).optional(),
}).superRefine((data, ctx) => {
  if (!data.message && !data.attachmentUrl) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Écrivez un message ou ajoutez une pièce jointe",
      path: ["message"],
    });
  }
  if (Boolean(data.attachmentUrl) !== Boolean(data.attachmentType)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Les informations de la pièce jointe sont incomplètes",
      path: ["attachmentType"],
    });
  }
});

export const supportChatEditMessageSchema = z.object({
  message: z.string().trim().min(1, "Le message ne peut pas être vide").max(2000, "Le message est trop long"),
});