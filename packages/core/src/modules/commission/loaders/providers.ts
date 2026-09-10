import { asFunction, asValue, Lifetime } from "@medusajs/framework/awilix"
import { moduleProviderLoader } from "@medusajs/framework/modules-sdk"
import { LoaderOptions } from "@medusajs/framework/types"
import { MedusaError } from "@medusajs/framework/utils"
import { CommissionModuleOptions } from "@mercurjs/types"

import { SystemCommissionProvider } from "../providers"
import {
  CommissionDefaultProvider,
  CommissionProviderRegistrationPrefix,
} from "../services/provider-service"

const registrationFn = async (klass, container, pluginOptions) => {
  if (!klass?.identifier) {
    throw new MedusaError(
      MedusaError.Types.INVALID_ARGUMENT,
      "Trying to register a commission provider without a provider identifier."
    )
  }

  const key = `${CommissionProviderRegistrationPrefix}${pluginOptions.id ?? klass.identifier}`

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
}: LoaderOptions<CommissionModuleOptions>): Promise<void> => {
  await registrationFn(SystemCommissionProvider, container, {
    id: SystemCommissionProvider.identifier,
  })
  container.register(
    CommissionDefaultProvider,
    asValue(SystemCommissionProvider.identifier)
  )

  const providers = options?.providers ?? []

  await moduleProviderLoader({
    container,
    providers,
    registerServiceFn: registrationFn,
  })

  const isSingleProvider = providers.length === 1
  for (const provider of providers) {
    if (provider.is_default || isSingleProvider) {
      container.register(CommissionDefaultProvider, asValue(provider.id))
    }
  }

  if (options?.default_provider) {
    container.register(
      CommissionDefaultProvider,
      asValue(options.default_provider)
    )
  }
}
