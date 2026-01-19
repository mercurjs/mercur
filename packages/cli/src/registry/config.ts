import type { Config, RawConfig } from "../schema";
import { BUILTIN_REGISTRIES } from "./constants";

export function configWithDefaults(config?: Partial<Config> | Config): Config {
  const defaultConfig: RawConfig = {
    aliases: {
      workflows: "packages/api/src/workflows",
      api: "packages/api/src/api",
      links: "packages/api/src/links",
      modules: "packages/api/src/modules",
      vendor: "apps/vendor/src/pages",
      admin: "apps/admin/src/pages",
      lib: "packages/api/src/lib",
    },
    registries: BUILTIN_REGISTRIES,
  };

  const merged = {
    ...defaultConfig,
    ...(config || {}),
    aliases: {
      ...defaultConfig.aliases,
      ...(config?.aliases || {}),
    },
    registries: {
      // User registries come first so the first one is used as default for unnamespaced deps
      ...(config?.registries || {}),
      ...BUILTIN_REGISTRIES,
    },
  };

  return merged as Config;
}
