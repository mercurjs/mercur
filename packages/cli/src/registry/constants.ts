import type { z } from "zod";
import type { registryConfigSchema } from "./schema";

// Registry URL can be customized via environment variable
// Supports branch names: https://raw.githubusercontent.com/{owner}/{repo}/{branch}/packages/registry/registry
export const REGISTRY_URL =
  process.env.REGISTRY_URL ??
  // todo: change to main branch
  "https://raw.githubusercontent.com/mercurjs/mercur/new/packages/registry/index.ts";

// Built-in registries that are always available and cannot be overridden
export const BUILTIN_REGISTRIES: z.infer<typeof registryConfigSchema> = {
  "@mercurjs": `${REGISTRY_URL}/{type}/{name}.json`,
};
