import type { InputConfigWithArrayModules } from "@medusajs/framework/types"
import { defineConfig } from '@medusajs/framework/utils'

type HttpConfig = NonNullable<NonNullable<InputConfigWithArrayModules["projectConfig"]>["http"]>

export type MercurInputConfig = Omit<InputConfigWithArrayModules, "projectConfig"> & {
  projectConfig?: Omit<NonNullable<InputConfigWithArrayModules["projectConfig"]>, "http"> & {
    http?: HttpConfig & {
      vendorCors?: string
    }
  }
}

export function withMercur(config: MercurInputConfig = {}): InputConfigWithArrayModules {
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
    rbac: config.featureFlags?.rbac ?? true,
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
