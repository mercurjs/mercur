import { z } from "zod"
import { createFindParams } from "@medusajs/medusa/api/utils/validators"
import { RequestStatus } from "../../../../types"

export type VendorCreateProductTypeRequestType = z.infer<typeof VendorCreateProductTypeRequest>
export const VendorCreateProductTypeRequest = z.object({
  value: z.string(),
  metadata: z.record(z.unknown()).optional(),
})

export type VendorGetProductTypeRequestsParamsType = z.infer<typeof VendorGetProductTypeRequestsParams>
export const VendorGetProductTypeRequestsParams = createFindParams({
  offset: 0,
  limit: 50,
}).extend({
  q: z.string().optional(),
  request_status: z
    .union([z.nativeEnum(RequestStatus), z.array(z.nativeEnum(RequestStatus))])
    .optional(),
})
