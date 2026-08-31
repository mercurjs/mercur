import type { InputConfigWithArrayModules } from "@medusajs/framework/types"
import { defineConfig } from '@medusajs/framework/utils'
import { applyMercurPatches } from "./patches"
import { disableMedusaMiddlewares } from "./utils/disable-medusa-middlewares"

type HttpConfig = NonNullable<NonNullable<InputConfigWithArrayModules["projectConfig"]>["http"]>

export type MercurInputConfig = Omit<InputConfigWithArrayModules, "projectConfig"> & {
  projectConfig?: Omit<NonNullable<InputConfigWithArrayModules["projectConfig"]>, "http"> & {
    http?: HttpConfig & {
      vendorCors?: string
    }
    mercur?: {
      /**
       * Patch file names to skip, e.g. "@medusajs+core-flows@2.18.0.patch".
       * Each one restores an upstream bug, so only reach for this when a patch
       * conflicts with your own override.
       */
      disabledPatches?: string[]
    }
  }
}

export function withMercur(config: MercurInputConfig = {}): InputConfigWithArrayModules {
  // Before `disableMedusaMiddlewares`, which requires Medusa middleware modules
  // that pull in `@medusajs/core-flows` transitively. Patches are compiled on
  // first require, so anything that loads the targeted modules must run after
  // this. Medusa itself imports core-flows lazily, well after `medusa-config`
  // is evaluated, which is what leaves this window open at all.
  applyMercurPatches({
    disabled: config.projectConfig?.mercur?.disabledPatches,
  })
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
    // Off unless explicitly enabled. Route policy checks are fail-closed, so
    // enforcement is opt-in: with the flag off Medusa never wraps a handler in
    // a permission check, the declared route policies cost nothing, and the
    // middlewares that resolve an actor's roles return early.
    rbac: config.featureFlags?.rbac ?? false,
  }

  const modules = [
    ...(config.modules ?? []),
    ...((config.modules ?? []).some(
      (m) =>
        typeof m === "object" &&
        "resolve" in m &&
        m.resolve === "@medusajs/medusa/rbac"
    )
      ? []
      : [{ resolve: "@medusajs/medusa/rbac" as const }]),
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
