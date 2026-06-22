import { MedusaService } from "@medusajs/framework/utils"

import { Offer } from "./models"

class OfferModuleService extends MedusaService({
  Offer,
}) {}

export default OfferModuleService
