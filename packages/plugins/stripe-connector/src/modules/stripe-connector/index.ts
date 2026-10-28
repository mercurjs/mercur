import { Module } from "@medusajs/framework/utils"

import { STRIPE_CONNECTOR_MODULE } from "../../types/common"
import StripeConnectorModuleService from "./service"

export { StripeConnectorModuleService }

export default Module(STRIPE_CONNECTOR_MODULE, {
  service: StripeConnectorModuleService,
})
