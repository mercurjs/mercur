import type { ModuleProviderExports } from "@medusajs/types"

import type {
  CommissionCalculationContext,
  CreateCommissionLineDTO,
} from "./common"

export interface ICommissionProvider {
  /**
   * Compute the commission lines for an order-shaped context. Returned lines
   * without a `provider_id` are stamped with the provider's registration id.
   */
  getCommissionLines(
    context: CommissionCalculationContext
  ): Promise<CreateCommissionLineDTO[]>
}

export interface CommissionModuleOptions {
  /**
   * Providers to be registered next to the built-in `system` provider.
   */
  providers?: {
    /**
     * The module provider to be registered
     */
    resolve: string | ModuleProviderExports
    /**
     * The id of the provider
     */
    id: string
    /**
     * Key value pair of the configuration to be passed to the provider constructor
     */
    options?: Record<string, unknown>
    /**
     * Use this provider for every calculation. A single configured provider
     * is the default implicitly.
     */
    is_default?: boolean
  }[]

  /**
   * Provider id used when a calculation names none. Defaults to the built-in `system`.
   */
  default_provider?: string
}

declare module "@medusajs/types" {
  interface ModuleOptions {
    "@mercurjs/core/modules/commission": CommissionModuleOptions
  }
}
