import { MedusaService } from "@medusajs/framework/utils"

import { MediaImage } from "./models"

class MediaModuleService extends MedusaService({
  MediaImage,
}) { }

export default MediaModuleService
