import { z } from "zod"
import {
  createFindParams,
  createOperatorMap,
  createSelectParams,
} from "@medusajs/medusa/api/utils/validators"

export type VendorGetCollectionParamsType = z.infer<
  typeof VendorGetCollectionParams
>
export const VendorGetCollectionParams = createSelectParams()

export type VendorGetCollectionsParamsType = z.infer<
  typeof VendorGetCollectionsParams
>
export const VendorGetCollectionsParams = createFindParams({
  offset: 0,
  limit: 10,
}).merge(
  z.object({
    q: z.string().optional(),
    id: z.union([z.string(), z.array(z.string())]).optional(),
    title: z.union([z.string(), z.array(z.string())]).optional(),
    handle: z.union([z.string(), z.array(z.string())]).optional(),
    created_at: createOperatorMap().optional(),
    updated_at: createOperatorMap().optional(),
    deleted_at: createOperatorMap().optional(),
  })
)
