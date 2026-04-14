import { z } from "zod"

import { applyAndAndOrOperators } from "@medusajs/medusa/api/utils/common-validators/common"
import {
  createFindParams,
  createSelectParams,
} from "@medusajs/medusa/api/utils/validators"

export type VendorGetProductTagParamsType = z.infer<
  typeof VendorGetProductTagParams
>
export const VendorGetProductTagParams = createSelectParams()

export const VendorGetProductTagsParamsFields = z.object({
  q: z.string().optional(),
  id: z.union([z.string(), z.array(z.string())]).optional(),
  value: z.union([z.string(), z.array(z.string())]).optional(),
})

export type VendorGetProductTagsParamsType = z.infer<
  typeof VendorGetProductTagsParams
>
export const VendorGetProductTagsParams = createFindParams({
  limit: 20,
  offset: 0,
})
  .merge(VendorGetProductTagsParamsFields)
  .merge(applyAndAndOrOperators(VendorGetProductTagsParamsFields))
