import { z } from "zod"
import { createSelectParams } from "@medusajs/medusa/api/utils/validators"

export type VendorGetPaymentCollectionParamsType = z.infer<
  typeof VendorGetPaymentCollectionParams
>
export const VendorGetPaymentCollectionParams = createSelectParams()

export type VendorMarkPaymentCollectionAsPaidType = z.infer<
  typeof VendorMarkPaymentCollectionAsPaid
>
export const VendorMarkPaymentCollectionAsPaid = z
  .object({
    order_id: z.string(),
  })
  .strict()
