import { z } from "@medusajs/framework/zod"

export type AdminRecordExternalRefundType = z.infer<typeof AdminRecordExternalRefund>
export const AdminRecordExternalRefund = z
  .object({
    amount: z.number().positive(),
    reference: z.string().min(1).optional(),
    note: z.string().optional(),
  })
  .strict()
