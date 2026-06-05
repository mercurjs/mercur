import { z } from "zod"
import {
  createFindParams,
  createOperatorMap,
  createSelectParams,
} from "@medusajs/medusa/api/utils/validators"

export type VendorGetRefundReasonParamsType = z.infer<
  typeof VendorGetRefundReasonParams
>
export const VendorGetRefundReasonParams = createSelectParams()

export type VendorGetRefundReasonsParamsType = z.infer<
  typeof VendorGetRefundReasonsParams
>
export const VendorGetRefundReasonsParams = createFindParams({
  limit: 20,
  offset: 0,
}).merge(
  z.object({
    id: z.union([z.string(), z.array(z.string())]).optional(),
    q: z.string().optional(),
    created_at: createOperatorMap().optional(),
    updated_at: createOperatorMap().optional(),
  })
)
