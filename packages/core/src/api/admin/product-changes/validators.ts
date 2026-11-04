import { z } from "zod"
import {
  createFindParams,
  createOperatorMap,
  WithAdditionalData,
} from "@medusajs/medusa/api/utils/validators"
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

const InboxType = z.enum(["new_product", "update", "delete"])

export type AdminGetProductChangesParamsType = z.infer<
  typeof AdminGetProductChangesParams
>
export const AdminGetProductChangesParams = createFindParams({
  offset: 0,
  limit: 20,
}).merge(
  z.object({
    q: z.string().optional(),
    id: z.union([z.string(), z.array(z.string())]).optional(),
    product_id: z.union([z.string(), z.array(z.string())]).optional(),
    seller_id: z.union([z.string(), z.array(z.string())]).optional(),
    type: z.union([InboxType, z.array(InboxType)]).optional(),
    created_at: createOperatorMap().optional(),
    updated_at: createOperatorMap().optional(),
  })
)
