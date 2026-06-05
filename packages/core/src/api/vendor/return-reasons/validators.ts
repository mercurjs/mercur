import { z } from "zod"
import {
  createFindParams,
  createOperatorMap,
  createSelectParams,
} from "@medusajs/medusa/api/utils/validators"

export type VendorGetReturnReasonParamsType = z.infer<
  typeof VendorGetReturnReasonParams
>
export const VendorGetReturnReasonParams = createSelectParams()

export type VendorGetReturnReasonsParamsType = z.infer<
  typeof VendorGetReturnReasonsParams
>
export const VendorGetReturnReasonsParams = createFindParams({
  limit: 20,
  offset: 0,
}).merge(
  z.object({
    q: z.string().optional(),
    id: z.union([z.string(), z.array(z.string())]).optional(),
    value: z.union([z.string(), z.array(z.string())]).optional(),
    label: z.union([z.string(), z.array(z.string())]).optional(),
    description: z.union([z.string(), z.array(z.string())]).optional(),
    parent_return_reason_id: z
      .union([z.string(), z.array(z.string())])
      .optional(),
    created_at: createOperatorMap().optional(),
    updated_at: createOperatorMap().optional(),
  })
)
