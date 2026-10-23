import { z } from "zod"
import { createFindParams } from "@medusajs/medusa/api/utils/validators"
import { AdjustmentType } from "@mercurjs/types"

export type AdminGetAdjustmentsParamsType = z.infer<typeof AdminGetAdjustmentsParams>
export const AdminGetAdjustmentsParams = createFindParams({ offset: 0, limit: 20 }).merge(
  z.object({
    account_id: z.union([z.string(), z.array(z.string())]).optional(),
    type: z.union([z.string(), z.array(z.string())]).optional(),
  })
)

export type AdminCreateAdjustmentType = z.infer<typeof AdminCreateAdjustment>
export const AdminCreateAdjustment = z
  .object({
    account_id: z.string().optional(),
    seller_id: z.string().optional(),
    type: z.nativeEnum(AdjustmentType),
    amount: z.number().positive(),
    currency_code: z.string().min(3).max(3),
    reason: z.string().max(1024).optional().nullable(),
  })
  .strict()
  .refine((body) => !!body.account_id || !!body.seller_id, {
    message: "account_id or seller_id is required",
  })
