import { z } from "zod"
import { createFindParams, createOperatorMap } from "@medusajs/medusa/api/utils/validators"
import { RequestStatus } from "../../../../types"

export type VendorCreateProductTagRequestType = z.infer<typeof VendorCreateProductTagRequest>
export const VendorCreateProductTagRequest = z.object({
  value: z.string(),
  metadata: z.record(z.unknown()).optional(),
})

export type VendorGetProductTagRequestsParamsType = z.infer<typeof VendorGetProductTagRequestsParams>
export const VendorGetProductTagRequestsParams = createFindParams({
  offset: 0,
  limit: 50,
}).extend({
  q: z.string().optional(),
  request_status: z
    .union([z.nativeEnum(RequestStatus), z.array(z.nativeEnum(RequestStatus))])
    .optional(),
  created_at: createOperatorMap().optional(),
  updated_at: createOperatorMap().optional(),
})
