import { z } from "zod"

import { AdminGetOrdersParams as CoreAdminGetOrdersParams } from "@medusajs/medusa/api/admin/orders/validators"

// Core's schema is a `.transform(...)` (ZodEffects), so we can't `.merge()` on
// it directly. Compose via intersection, then re-wrap in a noop `.transform()`
// so `validateAndTransformQuery` accepts it (its signature requires ZodObject
// or ZodEffects).
export const AdminGetOrdersParams = CoreAdminGetOrdersParams.and(
  z.object({
    seller_id: z.union([z.string(), z.array(z.string())]).optional(),
    name: z.union([z.string(), z.array(z.string())]).optional(),
  })
).transform((v) => v)

export type AdminGetOrdersParamsType = z.infer<typeof AdminGetOrdersParams>
