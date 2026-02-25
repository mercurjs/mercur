import { z } from "zod";
import { registryConfigSchema } from "../registry/schema";

export const rawConfigSchema = z
  .object({
    $schema: z.string().optional(),
    aliases: z.object({
      api: z.string(),
      vendor: z.string(),
      admin: z.string(),
    }),
    registries: registryConfigSchema.optional(),
  })
  .strict();

export const configSchema = rawConfigSchema.extend({
  resolvedPaths: z.object({
    cwd: z.string(),
    api: z.string(),
    vendor: z.string(),
    admin: z.string(),
  }),
});

export type Config = z.infer<typeof configSchema>;
export type RawConfig = z.infer<typeof rawConfigSchema>;
