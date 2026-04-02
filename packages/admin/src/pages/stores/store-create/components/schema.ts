import { z } from "zod";

export const CreateStoreSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  currency_code: z.string().min(1),
  description: z.string().optional().or(z.literal("")),
  handle: z.string().optional().or(z.literal("")),
  member_email: z.string().email(),
});

export type CreateStoreSchemaType = z.infer<typeof CreateStoreSchema>;
