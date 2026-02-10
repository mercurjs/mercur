import { asFunction, asValue, Lifetime } from "@medusajs/framework/awilix"
import { moduleProviderLoader } from "@medusajs/framework/modules-sdk"
import {
  LoaderOptions,
  ModuleProvider,
  ModulesSdkTypes,
} from "@medusajs/framework/types"

import {
  PayoutProviderRegistrationPrefix,
} from "../services/provider-service"
import { SystemPayoutProvider } from "../providers"

const registrationFn = async (klass, container, pluginOptions) => {
  const key = `${PayoutProviderRegistrationPrefix}${klass.identifier}_${pluginOptions.id}`

  container.register({
    [key]: asFunction(
      (cradle) => new klass(cradle, pluginOptions.options ?? {}),
      {
        lifetime: klass.LIFE_TIME || Lifetime.SINGLETON,
      }
    ),
  })
}

export default async ({
  container,
  options,
}: LoaderOptions<
  (
    | ModulesSdkTypes.ModuleServiceInitializeOptions
    | ModulesSdkTypes.ModuleServiceInitializeCustomDataLayerOptions
  ) & { providers: ModuleProvider[] }
>): Promise<void> => {
  const providers = options?.providers || []
  if (!providers.length) {
    return await registrationFn(SystemPayoutProvider, container, {
      id: "default",
    })
  }

  await moduleProviderLoader({
    container,
    providers: options?.providers || [],
    registerServiceFn: registrationFn,
  })
}
