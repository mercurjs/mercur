import { z } from "@medusajs/framework/zod"

export type AdminCaptureExternalPaymentType = z.infer<typeof AdminCaptureExternalPayment>
export const AdminCaptureExternalPayment = z
  .object({
    reference: z.string().min(1).optional(),
  })
  .strict()

export type AdminCancelExternalPaymentType = z.infer<typeof AdminCancelExternalPayment>
export const AdminCancelExternalPayment = z
  .object({
    reference: z.string().min(1).optional(),
  })
  .strict()
