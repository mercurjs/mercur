import { cosmiconfig } from "cosmiconfig";
import { loadConfig } from "tsconfig-paths";
import { BUILTIN_REGISTRIES, ConfigParseError } from "../registry";
import {
  type Config,
  configSchema,
  type RawConfig,
  rawConfigSchema,
} from "../schema";
import { resolveImport } from "./resolve-import";

export const DEFAULT_API = "packages/api/src";
export const DEFAULT_VENDOR = "apps/vendor/src";
export const DEFAULT_ADMIN = "apps/admin/src";

export const explorer = cosmiconfig("blocks", {
  searchPlaces: ["blocks.json"],
});

export async function getConfig(cwd: string): Promise<Config | null> {
  const config = await getRawConfig(cwd);

  if (!config) {
    return null;
  }

  return await resolveConfigPaths(cwd, config);
}

export async function resolveConfigPaths(
  cwd: string,
  config: RawConfig
): Promise<Config> {
  // User registries come first so the first one is used as default for unnamespaced deps
  config.registries = {
    ...(config.registries || {}),
    ...BUILTIN_REGISTRIES,
  };

  const tsConfig = await loadConfig(cwd);

  if (tsConfig.resultType === "failed") {
    throw new Error(
      `Failed to load tsconfig.json. ${tsConfig.message ?? ""}`.trim()
    );
  }

  return configSchema.parse({
    ...config,
    resolvedPaths: {
      cwd,
      api: await resolveImport(config.aliases.api, tsConfig),
      vendor: await resolveImport(config.aliases.vendor, tsConfig),
      admin: await resolveImport(config.aliases.admin, tsConfig),
    },
  });
}

export async function getRawConfig(cwd: string): Promise<RawConfig | null> {
  try {
    const configResult = await explorer.search(cwd);

    if (!configResult) {
      return null;
    }

    const config = rawConfigSchema.parse(configResult.config);

    if (config.registries) {
      for (const registryName of Object.keys(config.registries)) {
        if (registryName in BUILTIN_REGISTRIES) {
          throw new Error(
            `"${registryName}" is a built-in registry and cannot be overridden.`
          );
        }
      }
    }

    return config;
  } catch (error) {
    if (error instanceof Error && error.message.includes("reserved registry")) {
      throw error;
    }
    throw new ConfigParseError(cwd, error);
  }
}

type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export function createConfig(partial?: DeepPartial<Config>): Config {
  const defaultConfig: Config = {
    resolvedPaths: {
      cwd: process.cwd(),
      api: "",
      vendor: "",
      admin: "",
    },
    aliases: {
      api: DEFAULT_API,
      vendor: DEFAULT_VENDOR,
      admin: DEFAULT_ADMIN,
    },
    registries: {
      ...BUILTIN_REGISTRIES,
    },
  };

  if (partial) {
    return {
      ...defaultConfig,
      ...partial,
      resolvedPaths: {
        ...defaultConfig.resolvedPaths,
        ...(partial.resolvedPaths || {}),
      },
      aliases: {
        ...defaultConfig.aliases,
        ...(partial.aliases || {}),
      },
      registries: {
        ...defaultConfig.registries,
        ...(partial.registries || {}),
      },
    };
  }

  return defaultConfig;
}
