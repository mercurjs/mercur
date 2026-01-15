import type { z } from "zod";
import type { Config } from "../schema";
import { buildUrlAndHeadersForRegistryBlock } from "./builder";
import { configWithDefaults } from "./config";
import { clearRegistryContext } from "./context";
import { extractEnvVars } from "./env";
import { RegistryMissingEnvironmentVariablesError } from "./errors";
import type { registryConfigItemSchema } from "./schema";

export function extractEnvVarsFromRegistryConfig(
  config: z.infer<typeof registryConfigItemSchema>
): string[] {
  const vars = new Set<string>();

  if (typeof config === "string") {
    for (const v of extractEnvVars(config)) {
      vars.add(v);
    }
  } else {
    for (const v of extractEnvVars(config.url)) {
      vars.add(v);
    }

    if (config.params) {
      for (const value of Object.values(config.params)) {
        for (const v of extractEnvVars(value)) {
          vars.add(v);
        }
      }
    }

    if (config.headers) {
      for (const value of Object.values(config.headers)) {
        for (const v of extractEnvVars(value)) {
          vars.add(v);
        }
      }
    }
  }

  return Array.from(vars);
}

export function validateRegistryConfig(
  registryName: string,
  config: z.infer<typeof registryConfigItemSchema>
): void {
  const requiredVars = extractEnvVarsFromRegistryConfig(config);
  const missing = requiredVars.filter((v) => !process.env[v]);

  if (missing.length > 0) {
    throw new RegistryMissingEnvironmentVariablesError(registryName, missing);
  }
}

export function validateRegistryConfigForBlocks(
  blocks: string[],
  config?: Config
): void {
  for (const item of blocks) {
    buildUrlAndHeadersForRegistryBlock(item, configWithDefaults(config));
  }

  clearRegistryContext();
}
