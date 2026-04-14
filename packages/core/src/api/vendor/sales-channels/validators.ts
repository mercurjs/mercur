import { z } from "zod"
import {
  createFindParams,
  createSelectParams,
} from "@medusajs/medusa/api/utils/validators"
import { booleanString } from "@medusajs/medusa/api/utils/common-validators/common"

export type VendorGetSalesChannelParamsType = z.infer<
  typeof VendorGetSalesChannelParams
>
export const VendorGetSalesChannelParams = createSelectParams()

export type VendorGetSalesChannelsParamsType = z.infer<
  typeof VendorGetSalesChannelsParams
>
export const VendorGetSalesChannelsParams = createFindParams({
  offset: 0,
  limit: 10,
}).merge(
  z.object({
    q: z.string().optional(),
    id: z.union([z.string(), z.array(z.string())]).optional(),
    name: z.union([z.string(), z.array(z.string())]).optional(),
    is_disabled: booleanString().optional(),
  })
)
