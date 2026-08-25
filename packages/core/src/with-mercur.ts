import type { InputConfigWithArrayModules } from "@medusajs/framework/types"
import { defineConfig } from '@medusajs/framework/utils'
import { disableMedusaMiddlewares } from "./utils/disable-medusa-middlewares"

type HttpConfig = NonNullable<NonNullable<InputConfigWithArrayModules["projectConfig"]>["http"]>

export type MercurInputConfig = Omit<InputConfigWithArrayModules, "projectConfig"> & {
  projectConfig?: Omit<NonNullable<InputConfigWithArrayModules["projectConfig"]>, "http"> & {
    http?: HttpConfig & {
      vendorCors?: string
    }
  }
}

export function withMercur(config: MercurInputConfig = {}): InputConfigWithArrayModules {
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
