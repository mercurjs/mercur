import type { Config, RawConfig } from "../schema";
import { BUILTIN_REGISTRIES } from "./constants";

export function configWithDefaults(config?: Partial<Config> | Config): Config {
  const defaultConfig: RawConfig = {
    aliases: {
      workflows: "@/apps/api/src/workflows",
      api: "@/apps/api/src/api",
      links: "@/apps/api/src/links",
      modules: "@/apps/api/src/modules",
      vendorPages: "@/apps/vendor/src/pages",
      adminPages: "@/apps/admin/src/pages",
      lib: "@/apps/api/src/lib",
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
