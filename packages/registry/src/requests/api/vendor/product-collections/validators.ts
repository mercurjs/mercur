import { z } from "zod"
import { createFindParams } from "@medusajs/medusa/api/utils/validators"
import { RequestStatus } from "../../../types"

export type VendorCreateProductCollectionRequestType = z.infer<typeof VendorCreateProductCollectionRequest>
export const VendorCreateProductCollectionRequest = z.object({
  title: z.string(),
  handle: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
})

export type VendorGetProductCollectionRequestsParamsType = z.infer<typeof VendorGetProductCollectionRequestsParams>
export const VendorGetProductCollectionRequestsParams = createFindParams({
  offset: 0,
  limit: 50,
}).extend({
  request_status: z
    .union([z.nativeEnum(RequestStatus), z.array(z.nativeEnum(RequestStatus))])
    .optional(),
})
