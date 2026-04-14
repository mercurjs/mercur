import { z } from "zod"
import { createFindParams } from "@medusajs/medusa/api/utils/validators"
import { booleanString } from "@medusajs/medusa/api/utils/common-validators/common"

export type VendorGetFulfillmentProvidersParamsType = z.infer<
  typeof VendorGetFulfillmentProvidersParams
>
export const VendorGetFulfillmentProvidersParams = createFindParams({
  offset: 0,
  limit: 50,
}).merge(
  z.object({
    id: z.union([z.string(), z.array(z.string())]).optional(),
    stock_location_id: z
      .union([z.string(), z.array(z.string())])
      .optional(),
    is_enabled: booleanString().optional(),
    q: z.string().optional(),
  })
)
