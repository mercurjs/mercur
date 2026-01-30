import { z } from "zod"
import {
  createFindParams,
  createOperatorMap,
  createSelectParams,
} from "@medusajs/medusa/api/utils/validators"
import { booleanString } from "@medusajs/medusa/api/utils/common-validators/common"

export type VendorGetPaymentParamsType = z.infer<typeof VendorGetPaymentParams>
export const VendorGetPaymentParams = createSelectParams()

export type VendorGetPaymentsParamsType = z.infer<typeof VendorGetPaymentsParams>
export const VendorGetPaymentsParams = createFindParams({
  limit: 20,
  offset: 0,
}).merge(
  z.object({
    q: z.string().optional(),
    id: z.union([z.string(), z.array(z.string())]).optional(),
    payment_session_id: z.union([z.string(), z.array(z.string())]).optional(),
    created_at: createOperatorMap().optional(),
    updated_at: createOperatorMap().optional(),
  })
)

export type VendorGetPaymentProvidersParamsType = z.infer<
  typeof VendorGetPaymentProvidersParams
>
export const VendorGetPaymentProvidersParams = createFindParams({
  limit: 20,
  offset: 0,
}).merge(
  z.object({
    id: z.union([z.string(), z.array(z.string())]).optional(),
    is_enabled: booleanString().optional(),
  })
)

export type VendorCreatePaymentCaptureType = z.infer<
  typeof VendorCreatePaymentCapture
>
export const VendorCreatePaymentCapture = z
  .object({
    amount: z.number().optional(),
  })
  .strict()

export type VendorCreatePaymentRefundType = z.infer<
  typeof VendorCreatePaymentRefund
>
export const VendorCreatePaymentRefund = z
  .object({
    amount: z.number().optional(),
    refund_reason_id: z.string().optional(),
    note: z.string().optional(),
  })
  .strict()
