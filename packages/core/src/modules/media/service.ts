import { MedusaService } from "@medusajs/framework/utils"

import { Image } from "./models"

// Property key is `MediaImage` (matching the model's entity name) so the
// generated service methods (`createMediaImages`, `listMediaImages`, …) and
// the remote-query link alias agree. A mismatched `Image` key produced
// `listImages` while the link graph asked for `listMediaImages`.
class MediaModuleService extends MedusaService({
  MediaImage: Image,
}) {}

export default MediaModuleService
