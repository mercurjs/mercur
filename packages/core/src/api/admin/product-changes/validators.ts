import { z } from "zod"
import { WithAdditionalData } from "@medusajs/medusa/api/utils/validators"
import { AdditionalData } from "@medusajs/framework/types"

const ConfirmProductChange = z
  .object({
    internal_note: z.string().optional(),
  })
  .strict()
export type AdminConfirmProductChangeType = z.infer<
  typeof ConfirmProductChange
> &
  AdditionalData
export const AdminConfirmProductChange = WithAdditionalData(ConfirmProductChange)

const CancelProductChange = z
  .object({
    internal_note: z.string().optional(),
  })
  .strict()
export type AdminCancelProductChangeType = z.infer<
  typeof CancelProductChange
> &
  AdditionalData
export const AdminCancelProductChange = WithAdditionalData(CancelProductChange)
