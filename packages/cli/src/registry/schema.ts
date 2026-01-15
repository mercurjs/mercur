import { z } from "zod";

export type RegistryItemCategory =
  | "workflows"
  | "api"
  | "links"
  | "modules"
  | "vendorPages"
  | "adminPages"
  | "lib";

export const registryItemTypeSchema = z.enum([
  "registry:workflow",
  "registry:api",
  "registry:link",
  "registry:module",
  "registry:vendor",
  "registry:admin",
  "registry:lib",
]);

// File with required content (for fetched items)
export const registryBlockFileSchema = z.object({
  path: z.string(),
  content: z.string(),
  type: registryItemTypeSchema,
  target: z.string().optional(),
});

// Base fields shared between index entries and full items
const registryBlockBaseSchema = z.object({
  $schema: z.string().optional(),
  name: z.string(),
  type: registryItemTypeSchema,
  title: z.string().optional(),
  author: z.string().min(2).optional(),
  description: z.string().optional(),
  dependencies: z.array(z.string()).optional(),
  devDependencies: z.array(z.string()).optional(),
  registryDependencies: z.array(z.string()).optional(),
  meta: z.record(z.string(), z.any()).optional(),
  docs: z.string().optional(),
  categories: z.array(z.string()).optional(),
});

// Full registry item - has files with content
export const registryBlockSchema = registryBlockBaseSchema.extend({
  files: z.array(registryBlockFileSchema),
});

export type RegistryBlock = z.infer<typeof registryBlockSchema>;

// Registry index - items don't have files
export const registrySchema = z.object({
  name: z.string(),
  homepage: z.string(),
  items: z.array(registryBlockBaseSchema),
});

export type Registry = z.infer<typeof registrySchema>;

export const registryIndexSchema = z.array(registryBlockBaseSchema);

export const registryResolvedItemsTreeSchema = registryBlockSchema.pick({
  dependencies: true,
  devDependencies: true,
  files: true,
  docs: true,
});

// Registry URL can either include {name} and {type} placeholders explicitly,
// or omit them and they will be auto-appended as {type}/{name}.json
export const registryConfigItemSchema = z.union([
  z.string(),
  z.object({
    url: z.string(),
    params: z.record(z.string(), z.string()).optional(),
    headers: z.record(z.string(), z.string()).optional(),
  }),
]);

export const registryConfigSchema = z.record(
  z.string().refine((key) => key.startsWith("@"), {
    message: "Registry names must start with @ (e.g., @mercurjs)",
  }),
  registryConfigItemSchema
);
