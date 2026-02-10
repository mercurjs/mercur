import { z } from "zod"
import {
  createFindParams,
  createOperatorMap,
  createSelectParams,
} from "@medusajs/medusa/api/utils/validators"

export type VendorGetPayoutParamsType = z.infer<typeof VendorGetPayoutParams>
export const VendorGetPayoutParams = createSelectParams()

export type VendorGetPayoutsParamsType = z.infer<typeof VendorGetPayoutsParams>
export const VendorGetPayoutsParams = createFindParams({
  limit: 20,
  offset: 0,
}).merge(
  z.object({
    status: z.union([z.string(), z.array(z.string())]).optional(),
    created_at: createOperatorMap().optional(),
    updated_at: createOperatorMap().optional(),
  })
)
