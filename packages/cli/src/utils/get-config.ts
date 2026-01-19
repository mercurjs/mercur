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

export const DEFAULT_WORKFLOWS = "@/workspace/packages/api/src/workflows";
export const DEFAULT_API = "@/workspace/packages/api/src/api";
export const DEFAULT_LINKS = "@/workspace/packages/api/src/links";
export const DEFAULT_MODULES = "@/workspace/packages/api/src/modules";
export const DEFAULT_VENDOR = "@/workspace/apps/vendor/src/pages";
export const DEFAULT_ADMIN = "@/workspace/apps/admin/src/pages";
export const DEFAULT_LIB = "@/workspace/packages/api/src/lib";

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
      workflows: await resolveImport(config.aliases.workflows, tsConfig),
      api: await resolveImport(config.aliases.api, tsConfig),
      links: await resolveImport(config.aliases.links, tsConfig),
      modules: await resolveImport(config.aliases.modules, tsConfig),
      vendor: await resolveImport(config.aliases.vendor, tsConfig),
      admin: await resolveImport(config.aliases.admin, tsConfig),
      lib: await resolveImport(config.aliases.lib, tsConfig),
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
      admin: "",
      lib: "",
      links: "",
      modules: "",
      vendor: "",
      workflows: "",
      api: "",
    },
    aliases: {
      workflows: DEFAULT_WORKFLOWS,
      api: DEFAULT_API,
      links: DEFAULT_LINKS,
      modules: DEFAULT_MODULES,
      vendor: DEFAULT_VENDOR,
      admin: DEFAULT_ADMIN,
      lib: DEFAULT_LIB,
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
