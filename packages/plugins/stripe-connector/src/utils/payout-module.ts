import { MedusaContainer } from "@medusajs/framework/types"
import { IPayoutModuleService, MercurModules } from "@mercurjs/types"

import StripeConnectorModuleService from "../modules/stripe-connector/service"
import { STRIPE_CONNECTOR_MODULE } from "../types/common"

export const resolvePayoutModule = (container: MedusaContainer) =>
  container.resolve<IPayoutModuleService>(MercurModules.PAYOUT)

export const resolveConnector = (container: MedusaContainer) =>
  container.resolve<StripeConnectorModuleService>(STRIPE_CONNECTOR_MODULE)
