import { z } from 'zod';

export const ResendEmailVerificationLinkSchema = z
  .object({
    email: z.string().email(),
  })
  .strict();

export type ResendEmailVerificationLinkType = z.infer<
  typeof ResendEmailVerificationLinkSchema
>;
