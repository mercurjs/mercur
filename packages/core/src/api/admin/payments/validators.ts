import { z } from "zod"

export type AdminCreatePaymentRefundType = z.infer<
  typeof AdminCreatePaymentRefund
>
export const AdminCreatePaymentRefund = z
  .object({
    amount: z.number().optional(),
    refund_reason_id: z.string().optional(),
    note: z.string().optional(),
    order_id: z.string().optional(),
  })
  .strict()
