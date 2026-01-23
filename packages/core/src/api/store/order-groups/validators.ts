import { z } from "zod"
import {
  createFindParams,
  createOperatorMap,
  createSelectParams,
} from "@medusajs/medusa/api/utils/validators"

export type StoreGetOrderGroupParamsType = z.infer<typeof StoreGetOrderGroupParams>
export const StoreGetOrderGroupParams = createSelectParams()

export type StoreGetOrderGroupsParamsType = z.infer<typeof StoreGetOrderGroupsParams>
export const StoreGetOrderGroupsParams = createFindParams({
  offset: 0,
  limit: 50,
}).merge(
  z.object({
    id: z.union([z.string(), z.array(z.string())]).optional(),
    created_at: createOperatorMap().optional(),
    updated_at: createOperatorMap().optional(),
  })
)
