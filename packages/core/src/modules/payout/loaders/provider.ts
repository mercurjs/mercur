import { moduleProviderLoader } from "@medusajs/framework/modules-sdk"
import {
  LoaderOptions,
  ModuleProvider,
  ModulesSdkTypes,
} from "@medusajs/framework/types"
import { asFunction, asValue, Lifetime } from "@medusajs/framework/awilix"
import PayoutProviderService, {
  PayoutProviderIdentifierRegistrationName,
  PayoutProviderRegistrationPrefix,
} from "../services/provider-service"
import { SystemPayoutProvider } from "../providers/system"

const registrationFn = async (klass, container, pluginOptions) => {
  const key = PayoutProviderService.getRegistrationIdentifier(
    klass,
    pluginOptions.id
  )

  container.register({
    [PayoutProviderRegistrationPrefix + key]: asFunction(
      (cradle) => new klass(cradle, pluginOptions.options ?? {}),
      {
        lifetime: klass.LIFE_TIME || Lifetime.SINGLETON,
      }
    ),
  })

  container.registerAdd(PayoutProviderIdentifierRegistrationName, asValue(key))
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
    providers.push({
      resolve: SystemPayoutProvider,
      id: 'default',
    })
  }

  await moduleProviderLoader({
    container,
    providers,
    registerServiceFn: registrationFn,
  })
}
