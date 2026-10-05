import { z } from "zod";

export const MAX_TASK_INVITES = 2_147_483_647;
export const MAX_TASK_REWARD = 9_999_999_999_999.99;

const numericInput = z.preprocess(
  (value) => typeof value === "string" && value.trim() !== "" ? Number(value) : value,
  z.number().finite(),
);

const taskNameSchema = z.string().trim().min(1).max(200);
const taskDescriptionSchema = z.string().trim().min(1).max(2_000);
const requiredInvitesSchema = numericInput.pipe(
  z.number().int().min(1).max(MAX_TASK_INVITES),
);
const rewardSchema = numericInput.pipe(
  z.number()
    .min(0)
    .max(MAX_TASK_REWARD)
    .refine((value) => Math.abs(value * 100 - Math.round(value * 100)) < 1e-7, {
      message: "La récompense doit avoir au plus deux décimales",
    }),
);
const sortOrderSchema = numericInput.pipe(
  z.number().int().min(0).max(MAX_TASK_INVITES),
);

export const adminTaskCreateSchema = z.object({
  name: taskNameSchema,
  description: taskDescriptionSchema,
  requiredInvites: requiredInvitesSchema,
  reward: rewardSchema,
  sortOrder: sortOrderSchema,
}).strict();

export const adminTaskUpdateSchema = z.object({
  name: taskNameSchema.optional(),
  description: taskDescriptionSchema.optional(),
  requiredInvites: requiredInvitesSchema.optional(),
  reward: rewardSchema.optional(),
  sortOrder: sortOrderSchema.optional(),
  isActive: z.boolean().optional(),
}).strict().refine((value) => Object.keys(value).length > 0, {
  message: "Au moins un champ doit être modifié",
});

export const taskIdSchema = z.string()
  .regex(/^[1-9]\d*$/)
  .transform(Number)
  .pipe(z.number().int().min(1).max(MAX_TASK_INVITES));

export type AdminTaskCreateInput = z.infer<typeof adminTaskCreateSchema>;
export type AdminTaskUpdateInput = z.infer<typeof adminTaskUpdateSchema>;
