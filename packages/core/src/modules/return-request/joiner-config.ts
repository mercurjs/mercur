import { defineJoinerConfig } from "@medusajs/framework/utils"
import { MercurModules } from "@mercurjs/types"

import ReturnRequest from "./models/return-request"

export const joinerConfig = defineJoinerConfig(MercurModules.RETURN_REQUEST, {
  linkableKeys: {
    return_request_id: ReturnRequest.name,
  },
})
