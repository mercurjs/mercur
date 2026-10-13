import { z } from "zod"
import {
  createFindParams,
  createOperatorMap,
  createSelectParams,
} from "@medusajs/medusa/api/utils/validators"

export type StoreGetReturnRequestParamsType = z.infer<
  typeof StoreGetReturnRequestParams
>
export const StoreGetReturnRequestParams = createSelectParams()

export type StoreGetReturnRequestsParamsType = z.infer<
  typeof StoreGetReturnRequestsParams
>
export const StoreGetReturnRequestsParams = createFindParams({
  offset: 0,
  limit: 20,
}).merge(
  z.object({
    id: z.union([z.string(), z.array(z.string())]).optional(),
    order_id: z.union([z.string(), z.array(z.string())]).optional(),
    status: z.union([z.string(), z.array(z.string())]).optional(),
    created_at: createOperatorMap().optional(),
    updated_at: createOperatorMap().optional(),
  })
)

export const ReturnRequestItem = z.object({
  id: z.string(),
  quantity: z.number().int().min(1),
  reason_id: z.string().optional(),
  note: z.string().max(1000).optional(),
})

export type StoreCreateReturnRequestType = z.infer<
  typeof StoreCreateReturnRequest
>
export const StoreCreateReturnRequest = z.object({
  order_id: z.string(),
  items: z.array(ReturnRequestItem).min(1),
  description: z.string().max(1000).optional(),
  attachments: z.array(z.string().url()).max(10).optional(),
})
