import { z } from "zod"

export type AdminConfirmProductChangeType = z.infer<
  typeof AdminConfirmProductChange
>
export const AdminConfirmProductChange = z
  .object({
    internal_note: z.string().optional(),
  })
  .strict()

export type AdminCancelProductChangeType = z.infer<
  typeof AdminCancelProductChange
>
export const AdminCancelProductChange = z
  .object({
    internal_note: z.string().optional(),
  })
  .strict()
