import { MedusaService } from "@medusajs/framework/utils"

import { Image } from "./models"

class MediaModuleService extends MedusaService({
  Image,
}) {}

export default MediaModuleService
