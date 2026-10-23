import { z } from "zod"
import { createFindParams, createOperatorMap, createSelectParams } from "@medusajs/medusa/api/utils/validators"

export const AdminGetTransferParams = createSelectParams()
export type AdminGetTransfersParamsType = z.infer<typeof AdminGetTransfersParams>
export const AdminGetTransfersParams = createFindParams({ offset: 0, limit: 20 }).merge(
  z.object({
    id: z.union([z.string(), z.array(z.string())]).optional(),
    type: z.union([z.string(), z.array(z.string())]).optional(),
    status: z.union([z.string(), z.array(z.string())]).optional(),
    account_id: z.union([z.string(), z.array(z.string())]).optional(),
    order_id: z.union([z.string(), z.array(z.string())]).optional(),
    settlement_id: z.union([z.string(), z.array(z.string())]).optional(),
    created_at: createOperatorMap().optional(),
    updated_at: createOperatorMap().optional(),
  })
)
