import { z } from "zod"

export const AdminRecordExternalRefund = z.object({
  amount: z.number().positive(),
  reference: z.string().min(1).optional(),
  note: z.string().optional(),
})
export type AdminRecordExternalRefundType = z.infer<
  typeof AdminRecordExternalRefund
>
