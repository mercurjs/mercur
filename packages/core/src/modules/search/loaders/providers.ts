import { asFunction, Lifetime, LifetimeType } from "@medusajs/framework/awilix"
import { moduleProviderLoader } from "@medusajs/framework/modules-sdk"
import {
  LoaderOptions,
  ModuleProvider,
  ModulesSdkTypes,
} from "@medusajs/framework/types"

import { SearchProviderRegistrationPrefix } from "../services/search-provider-service"
import { OramaSearchProvider } from "../providers"

const registrationFn = async (
  klass: { identifier: string; LIFE_TIME?: LifetimeType },
  container: { register: (m: Record<string, unknown>) => void },
  pluginOptions: { id: string; options?: Record<string, unknown> }
) => {
  const key = `${SearchProviderRegistrationPrefix}${klass.identifier}_${pluginOptions.id}`

  container.register({
    [key]: asFunction(
      (cradle) =>
        new (klass as unknown as new (
          cradle: unknown,
          options: Record<string, unknown>
        ) => unknown)(cradle, pluginOptions.options ?? {}),
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
  ) & { provider?: ModuleProvider }
>): Promise<void> => {
  const provider = options?.provider

  if (!provider) {
    return await registrationFn(
      OramaSearchProvider as unknown as { identifier: string },
      container as unknown as {
        register: (m: Record<string, unknown>) => void
      },
      { id: "default" }
    )
  }

  await moduleProviderLoader({
    container,
    providers: [provider],
    registerServiceFn: registrationFn,
  })
}
