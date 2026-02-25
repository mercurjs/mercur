import type { Config, RawConfig } from "../schema";
import { BUILTIN_REGISTRIES } from "./constants";

export function configWithDefaults(config?: Partial<Config> | Config): Config {
  const defaultConfig: RawConfig = {
    aliases: {
      api: "packages/api/src",
      vendor: "apps/vendor/src",
      admin: "apps/admin/src",
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
