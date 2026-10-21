import { MedusaService } from "@medusajs/framework/utils"

import { IMagentoWebhookModuleService } from "../../../types"
import { MagentoWebhookDelivery, MagentoWebhookEndpoint } from "../models"

export class MagentoWebhookModuleService
  extends MedusaService({ MagentoWebhookEndpoint, MagentoWebhookDelivery })
  implements IMagentoWebhookModuleService {}

export default MagentoWebhookModuleService
