import { z } from "zod"
import { createFindParams, createOperatorMap } from "@medusajs/medusa/api/utils/validators"

export type AdminGetSettlementsParamsType = z.infer<typeof AdminGetSettlementsParams>
export const AdminGetSettlementsParams = createFindParams({ offset: 0, limit: 20 }).merge(
  z.object({
    id: z.union([z.string(), z.array(z.string())]).optional(),
    account_id: z.union([z.string(), z.array(z.string())]).optional(),
    currency_code: z.union([z.string(), z.array(z.string())]).optional(),
    status: z.union([z.string(), z.array(z.string())]).optional(),
    period_start: createOperatorMap().optional(),
    period_end: createOperatorMap().optional(),
  })
)
