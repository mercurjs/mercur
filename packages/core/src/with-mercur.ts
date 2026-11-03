import "./patches/register"

import type { InputConfigWithArrayModules } from "@medusajs/framework/types"
import { defineConfig } from '@medusajs/framework/utils'
import { assertPatchesDisabled } from "./patches"
import { disableMedusaMiddlewares } from "./utils/disable-medusa-middlewares"

type HttpConfig = NonNullable<NonNullable<InputConfigWithArrayModules["projectConfig"]>["http"]>

export type MercurInputConfig = Omit<InputConfigWithArrayModules, "projectConfig"> & {
  projectConfig?: Omit<NonNullable<InputConfigWithArrayModules["projectConfig"]>, "http"> & {
    http?: HttpConfig & {
      vendorCors?: string
    }
    mercur?: {
      /**
       * @deprecated Patches are applied when `@mercurjs/core` is imported,
       * before this config is read. Set `MERCUR_DISABLED_PATCHES` (comma
       * separated) in the process environment instead; listing a patch only
       * here fails the boot.
       */
      disabledPatches?: string[]
      /**
       * Anonymous usage telemetry (https://docs.mercurjs.com/telemetry).
       * Defaults to `true`; `MERCUR_DISABLE_TELEMETRY=true` or `DO_NOT_TRACK=1`
       * also turn it off.
       */
      telemetry?: boolean
    }
  }
}

export function withMercur(config: MercurInputConfig = {}): InputConfigWithArrayModules {
  assertPatchesDisabled(config.projectConfig?.mercur?.disabledPatches)
  disableMedusaMiddlewares()

  const projectConfig = {
    ...config.projectConfig,
    http: {
      ...config.projectConfig?.http,
    } as any,
  }

  const admin = {
    ...config.admin,
    disable: config.admin?.disable ?? true,
  }

  const featureFlags = {
    ...config.featureFlags,
    index_engine: config.featureFlags?.index_engine ?? true,
    caching: config.featureFlags?.caching ?? true,
  }

  const hasModule = (resolve: string) =>
    (config.modules ?? []).some(
      (m) => typeof m === "object" && "resolve" in m && m.resolve === resolve
    )

  const redisUrl = config.projectConfig?.redisUrl

  // The in-memory provider is per process: with several API instances, a
  // write handled by one never clears the others' caches, so Redis is used
  // whenever the project has it.
  const cachingModule = {
    resolve: "@medusajs/medusa/caching",
    options: redisUrl
      ? {
          providers: [
            {
              resolve: "@medusajs/caching-redis",
              id: "caching-redis",
              is_default: true,
              options: { redisUrl, prefix: "mercur:" },
            },
          ],
        }
      : { in_memory: { enable: true } },
  }

  const modules = [
    ...(config.modules ?? []),
    ...(featureFlags.index_engine && !hasModule("@medusajs/index")
      ? [{ resolve: "@medusajs/index" }]
      : []),
    ...(featureFlags.caching && !hasModule("@medusajs/medusa/caching")
      ? [cachingModule]
      : []),
  ]

  const plugins = [
    ...(config.plugins ?? []),
    ...(!config.plugins?.some(
      (p) =>
        (typeof p === "string" ? p : p.resolve) === "@mercurjs/core"
    )
      ? [{ resolve: "@mercurjs/core", options: {} }]
      : []),
  ]

  // @ts-ignore
  return defineConfig({
    ...config,
    projectConfig,
    admin,
    featureFlags,
    modules,
    plugins,
  } as InputConfigWithArrayModules)
}
