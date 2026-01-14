import { cosmiconfig } from "cosmiconfig";
import path from "path";
import { loadConfig } from "tsconfig-paths";
import { BUILTIN_REGISTRIES, ConfigParseError } from "../registry";
import {
  type Config,
  configSchema,
  type RawConfig,
  rawConfigSchema,
} from "../schema";
import { resolveImport } from "./resolve-import";

export const DEFAULT_WORKFLOWS = "@/apps/api/src/workflows";
export const DEFAULT_API = "@/apps/api/src/api";
export const DEFAULT_LINKS = "@/apps/api/src/links";
export const DEFAULT_MODULES = "@/apps/api/src/modules";
export const DEFAULT_VENDOR_PAGES = "@/apps/vendor/src/pages";
export const DEFAULT_ADMIN_PAGES = "@/apps/admin/src/pages";
export const DEFAULT_LIB = "@/apps/api/src/lib";

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
      workflows:
        (await resolveImport(config.aliases.workflows, tsConfig)) ||
        path.resolve(cwd, "apps/api/src/workflows"),
      api:
        (await resolveImport(config.aliases.api, tsConfig)) ||
        path.resolve(cwd, "apps/api/src/api"),
      links:
        (await resolveImport(config.aliases.links, tsConfig)) ||
        path.resolve(cwd, "apps/api/src/links"),
      modules:
        (await resolveImport(config.aliases.modules, tsConfig)) ||
        path.resolve(cwd, "apps/api/src/modules"),
      vendorPages:
        (await resolveImport(config.aliases.vendorPages, tsConfig)) ||
        path.resolve(cwd, "apps/vendor/src/pages"),
      adminPages:
        (await resolveImport(config.aliases.adminPages, tsConfig)) ||
        path.resolve(cwd, "apps/admin/src/pages"),
      lib:
        (await resolveImport(config.aliases.lib, tsConfig)) ||
        path.resolve(cwd, "apps/api/src/lib"),
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
      adminPages: "",
      lib: "",
      links: "",
      modules: "",
      vendorPages: "",
      workflows: "",
      api: "",
    },
    aliases: {
      workflows: DEFAULT_WORKFLOWS,
      api: DEFAULT_API,
      links: DEFAULT_LINKS,
      modules: DEFAULT_MODULES,
      vendorPages: DEFAULT_VENDOR_PAGES,
      adminPages: DEFAULT_ADMIN_PAGES,
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
