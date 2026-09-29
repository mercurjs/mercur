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
  }

  const modules = [...(config.modules ?? [])]

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
