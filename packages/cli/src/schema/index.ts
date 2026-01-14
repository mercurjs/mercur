import { z } from "zod";
import { registryConfigSchema } from "../registry/schema";

export const rawConfigSchema = z
  .object({
    $schema: z.string().optional(),
    aliases: z.object({
      workflows: z.string(),
      api: z.string(),
      links: z.string(),
      modules: z.string(),
      vendorPages: z.string(),
      adminPages: z.string(),
      lib: z.string(),
    }),
    registries: registryConfigSchema.optional(),
  })
  .strict();

export const configSchema = rawConfigSchema.extend({
  resolvedPaths: z.object({
    cwd: z.string(),
    workflows: z.string(),
    api: z.string(),
    links: z.string(),
    modules: z.string(),
    vendorPages: z.string(),
    adminPages: z.string(),
    lib: z.string(),
  }),
});

export type Config = z.infer<typeof configSchema>;
export type RawConfig = z.infer<typeof rawConfigSchema>;
