import { z } from "zod"
import { createFindParams, createOperatorMap, createSelectParams } from "@medusajs/medusa/api/utils/validators"

import { AdjustmentType } from "../../types/common"

export type AdminRunJobType = z.infer<typeof AdminRunJob>
export const AdminRunJob = z
  .object({
    seller_id: z.string().optional(),
    order_id: z.string().optional(),
    order_group_id: z.string().optional(),
  })
  .strict()

export type AdminGetSelectParamsType = z.infer<typeof AdminGetSelectParams>
export const AdminGetSelectParams = createSelectParams()

export type AdminGetCaptureParamsType = z.infer<typeof AdminGetCaptureParams>
export const AdminGetCaptureParams = createSelectParams()

export type AdminGetCapturesParamsType = z.infer<typeof AdminGetCapturesParams>
export const AdminGetCapturesParams = createFindParams({ offset: 0, limit: 20, order: "expires_at" }).merge(
  z.object({
    order_group_id: z.union([z.string(), z.array(z.string())]).optional(),
    status: z.union([z.string(), z.array(z.string())]).optional(),
    expires_at: createOperatorMap().optional(),
    created_at: createOperatorMap().optional(),
  })
)

export type AdminGetSettlementsParamsType = z.infer<typeof AdminGetSettlementsParams>
export const AdminGetSettlementsParams = createFindParams({ offset: 0, limit: 20 }).merge(
  z.object({
    id: z.union([z.string(), z.array(z.string())]).optional(),
    account_id: z.union([z.string(), z.array(z.string())]).optional(),
    currency_code: z.union([z.string(), z.array(z.string())]).optional(),
    status: z.union([z.string(), z.array(z.string())]).optional(),
    payout_status: z.union([z.string(), z.array(z.string())]).optional(),
    period_start: createOperatorMap().optional(),
    period_end: createOperatorMap().optional(),
  })
)

export type AdminGetAdjustmentsParamsType = z.infer<typeof AdminGetAdjustmentsParams>
export const AdminGetAdjustmentsParams = createFindParams({ offset: 0, limit: 20 }).merge(
  z.object({
    account_id: z.union([z.string(), z.array(z.string())]).optional(),
    type: z.union([z.string(), z.array(z.string())]).optional(),
    status: z.union([z.string(), z.array(z.string())]).optional(),
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

export type AdminIgnoreAccountType = z.infer<typeof AdminIgnoreAccount>
export const AdminIgnoreAccount = z.object({ ignored: z.boolean() }).strict()
