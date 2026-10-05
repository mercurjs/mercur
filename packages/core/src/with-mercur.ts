import "./patches/register"

import type { InputConfigWithArrayModules } from "@medusajs/framework/types"
import { defineConfig, Modules } from '@medusajs/framework/utils'
import { assertPatchesDisabled } from "./patches"
import { disableMedusaMiddlewares } from "./utils/disable-medusa-middlewares"
import { SPLIT_ORDER_PAYMENT_PROVIDER_RESOLVE } from "./providers/payment-split-order/constants"

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

type ModuleEntry = NonNullable<InputConfigWithArrayModules["modules"]>[number]

const PAYMENT_MODULE_RESOLVES = ["@medusajs/medusa/payment", "@medusajs/payment"]

const splitOrderPaymentProvider = {
  resolve: SPLIT_ORDER_PAYMENT_PROVIDER_RESOLVE,
  id: "mercur",
}

const isPaymentModule = (entry: ModuleEntry) => {
  if (typeof entry !== "string" && "key" in entry && entry.key === Modules.PAYMENT) {
    return true
  }

  const resolve =
    typeof entry === "string"
      ? entry
      : "resolve" in entry
      ? entry.resolve
      : undefined
  return typeof resolve === "string" && PAYMENT_MODULE_RESOLVES.includes(resolve)
}

// Every split order pays through its own payment collection, backed by the
// split-order provider, so the provider has to be registered in the Payment
// Module next to whatever providers the project configured.
function withSplitOrderPaymentProvider(modules: ModuleEntry[]): ModuleEntry[] {
  if (!modules.some(isPaymentModule)) {
    return [
      ...modules,
      {
        resolve: PAYMENT_MODULE_RESOLVES[0],
        options: { providers: [splitOrderPaymentProvider] },
      },
    ]
  }

  return modules.map((entry) => {
    if (!isPaymentModule(entry)) {
      return entry
    }

    const module_ = typeof entry === "string" ? { resolve: entry } : entry
    const options = (module_.options ?? {}) as { providers?: { resolve?: unknown }[] }
    const providers = options.providers ?? []

    if (providers.some((p) => p.resolve === SPLIT_ORDER_PAYMENT_PROVIDER_RESOLVE)) {
      return module_
    }

    return {
      ...module_,
      options: { ...options, providers: [...providers, splitOrderPaymentProvider] },
    }
  })
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

  const modules = withSplitOrderPaymentProvider([...(config.modules ?? [])])

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
