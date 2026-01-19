import type { Config, RawConfig } from "../schema";
import { BUILTIN_REGISTRIES } from "./constants";

export function configWithDefaults(config?: Partial<Config> | Config): Config {
  const defaultConfig: RawConfig = {
    aliases: {
      workflows: "@/workspace/packages/api/src/workflows",
      api: "@/workspace/packages/api/src/api",
      links: "@/workspace/packages/api/src/links",
      modules: "@/workspace/packages/api/src/modules",
      vendor: "@/workspace/apps/vendor/src/pages",
      admin: "@/workspace/apps/admin/src/pages",
      lib: "@/workspace/packages/api/src/lib",
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
