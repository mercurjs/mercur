import { Module } from "@medusajs/framework/utils"

import { MAGENTO_WEBHOOK_MODULE } from "../../types"
import MagentoWebhookModuleService from "./services/magento-webhook-module-service"

export { MAGENTO_WEBHOOK_MODULE }

export default Module(MAGENTO_WEBHOOK_MODULE, {
  service: MagentoWebhookModuleService,
})
