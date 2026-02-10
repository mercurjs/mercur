import { z } from "zod"
import {
  createFindParams,
  createOperatorMap,
  createSelectParams,
} from "@medusajs/medusa/api/utils/validators"

export type VendorGetCustomerParamsType = z.infer<typeof VendorGetCustomerParams>
export const VendorGetCustomerParams = createSelectParams()

export type VendorGetCustomersParamsType = z.infer<typeof VendorGetCustomersParams>
export const VendorGetCustomersParams = createFindParams({
  offset: 0,
  limit: 50,
}).merge(
  z.object({
    q: z.string().optional(),
    id: z.union([z.string(), z.array(z.string())]).optional(),
    email: z.union([z.string(), z.array(z.string())]).optional(),
    has_account: z.boolean().optional(),
    created_at: createOperatorMap().optional(),
    updated_at: createOperatorMap().optional(),
  })
)
