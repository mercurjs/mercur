import { z } from "zod"
import { createFindParams } from "@medusajs/medusa/api/utils/validators"
import { RequestStatus } from "../../../types"

export type VendorCreateProductCategoryRequestType = z.infer<typeof VendorCreateProductCategoryRequest>
export const VendorCreateProductCategoryRequest = z.object({
  name: z.string(),
  handle: z.string().optional(),
  description: z.string().optional(),
  is_active: z.boolean().optional(),
  is_internal: z.boolean().optional(),
  parent_category_id: z.string().nullish(),
  metadata: z.record(z.unknown()).optional(),
})

export type VendorGetProductCategoryRequestsParamsType = z.infer<typeof VendorGetProductCategoryRequestsParams>
export const VendorGetProductCategoryRequestsParams = createFindParams({
  offset: 0,
  limit: 50,
}).extend({
  request_status: z
    .union([z.nativeEnum(RequestStatus), z.array(z.nativeEnum(RequestStatus))])
    .optional(),
})
