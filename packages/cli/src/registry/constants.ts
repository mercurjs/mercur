import type { z } from "zod";
import type { registryConfigSchema } from "./schema";

export const REGISTRY_SCHEMA_URL = "https://raw.githubusercontent.com/mercurjs/mercur/new/packages/registry/schema/registry.json";
export const REGISTRY_ITEM_SCHEMA_URL = "https://raw.githubusercontent.com/mercurjs/mercur/new/packages/registry/schema/registry-item.json";

// Registry URL can be customized via environment variable
// Supports branch names: https://raw.githubusercontent.com/{owner}/{repo}/{branch}/packages/registry/registry
export const REGISTRY_URL =
  process.env.REGISTRY_URL ??
  // todo: change to main branch
  "https://raw.githubusercontent.com/mercurjs/mercur/new/packages/registry/r";

// Built-in registries that are always available and cannot be overridden
export const BUILTIN_REGISTRIES: z.infer<typeof registryConfigSchema> = {
  "@mercurjs": `${REGISTRY_URL}/{name}.json`,
};
