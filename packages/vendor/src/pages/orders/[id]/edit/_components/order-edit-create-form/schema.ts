import { z } from "zod"

/**
 * Order edit form schema. Mirrors admin's shape — only `note` and
 * `send_notification` live on the form itself; per-item quantity changes are
 * driven directly by the per-row hooks (`useUpdateOrderEditOriginalItem`,
 * `useUpdateOrderEditAddedItem`) so they don't need form state.
 */
export const OrderEditCreateSchema = z.object({
  note: z.string().optional(),
  send_notification: z.boolean().optional(),
})

export type CreateOrderEditSchemaType = z.infer<typeof OrderEditCreateSchema>
