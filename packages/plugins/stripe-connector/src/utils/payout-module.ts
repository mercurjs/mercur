import { FindConfig, MedusaContainer } from "@medusajs/framework/types"
import {
  MercurModules,
  PayoutAccountDTO,
  PayoutDTO,
  PayoutReversalDTO,
} from "@mercurjs/types"

import StripeConnectorModuleService from "../modules/stripe-connector/service"
import { STRIPE_CONNECTOR_MODULE } from "../types/common"

type Filters = Record<string, unknown>

/** The part of the core payout module the plugin reads. */
export interface PayoutModuleReader {
  listPayouts(filters?: Filters, config?: FindConfig<PayoutDTO>): Promise<PayoutDTO[]>
  listPayoutReversals(filters?: Filters, config?: FindConfig<PayoutReversalDTO>): Promise<PayoutReversalDTO[]>
  listAndCountPayouts(filters?: Filters, config?: FindConfig<PayoutDTO>): Promise<[PayoutDTO[], number]>
  listAndCountPayoutReversals(
    filters?: Filters,
    config?: FindConfig<PayoutReversalDTO>
  ): Promise<[PayoutReversalDTO[], number]>
  listPayoutAccounts(filters?: Filters, config?: FindConfig<PayoutAccountDTO>): Promise<PayoutAccountDTO[]>
  retrievePayoutAccount(id: string, config?: FindConfig<PayoutAccountDTO>): Promise<PayoutAccountDTO>
}

export const resolvePayoutModule = (container: MedusaContainer) =>
  container.resolve<PayoutModuleReader>(MercurModules.PAYOUT)

export const resolveConnector = (container: MedusaContainer) =>
  container.resolve<StripeConnectorModuleService>(STRIPE_CONNECTOR_MODULE)
