import { asFunction, Lifetime } from "@medusajs/framework/awilix"
import { moduleProviderLoader } from "@medusajs/framework/modules-sdk"
import {
  LoaderOptions,
  ModuleProvider,
  ModulesSdkTypes,
} from "@medusajs/framework/types"
import { MedusaError } from "@medusajs/framework/utils"

import { PayoutProviderRegistrationPrefix } from "../services/provider-service"
import { SystemPayoutProvider } from "../providers"

const registrationFn = async (klass, container, pluginOptions) => {
  if (!klass?.identifier) {
    throw new MedusaError(
      MedusaError.Types.INVALID_ARGUMENT,
      `Trying to register a payout provider without a provider identifier.`
    )
  }

  const key = `${PayoutProviderRegistrationPrefix}${klass.identifier}${
    pluginOptions.id ? `_${pluginOptions.id}` : ""
  }`

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
    providers,
    registerServiceFn: registrationFn,
  })
}
